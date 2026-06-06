// SMTC (System Media Transport Controls) helper for Windows.
//
// Commands:
//   smtc_query.exe status [--all]
//   smtc_query.exe sessions
//   smtc_query.exe control play|pause|toggle|next|prev|stop|seek [seconds]
//   smtc_query.exe control rate [number]
//   smtc_query.exe control shuffle [true|false]
//   smtc_query.exe control repeat [none|one|all]
//   smtc_query.exe control fast-forward|rewind

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using Windows.Media;
using Windows.Media.Control;
using Windows.Storage.Streams;

class SmtcQuery
{
    class SessionInfo
    {
        public string SourceAppUserModelId = "";
        public string AppName = "";
        public bool IsNetease;

        // Media properties
        public string Title = "";
        public string Artist = "";
        public string Album = "";
        public string AlbumArtist = "";
        public string Genres = "";
        public string Subtitle = "";
        public bool HasThumbnail;
        public string ThumbnailPath = "";
        public int TrackNumber;
        public int AlbumTrackCount;
        public string PlaybackType = "";

        // Playback status
        public string PlaybackStatus = "Unknown";

        // Timeline
        public double Position;
        public double Duration;
        public double StartTime;
        public double MinSeekTime;
        public double MaxSeekTime;
        public double PlaybackRate = 1.0;

        // Individual control capabilities
        public bool CanPlay;
        public bool CanPause;
        public bool CanNext;
        public bool CanPrev;
        public bool CanStop;
        public bool CanSeek;
        public bool CanShuffle;
        public bool CanRepeat;
        public bool CanFastForward;
        public bool CanRewind;
        public bool CanRate;

        // Backward-compat aggregated flag
        public bool CanControl => CanPlay || CanPause || CanNext || CanPrev || CanStop || CanSeek;
    }

    static void Main(string[] args)
    {
        try
        {
            Console.OutputEncoding = Encoding.UTF8;
            string command = args.Length > 0 ? args[0].ToLowerInvariant() : "status";
            var manager = GlobalSystemMediaTransportControlsSessionManager
                .RequestAsync()
                .AsTask()
                .GetAwaiter()
                .GetResult();

            if (command == "sessions")
            {
                WriteSessions(manager);
                return;
            }

            if (command == "control")
            {
                string action = args.Length > 1 ? args[1].ToLowerInvariant() : "";
                string value = args.Length > 2 ? args[2] : "";
                WriteControl(manager, action, value);
                return;
            }

            WriteStatus(manager, args.Any(arg => arg == "--all"));
        }
        catch (Exception ex)
        {
            Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"error\":" + JsonStr(ex.Message) + "}");
        }
    }

    static void WriteStatus(GlobalSystemMediaTransportControlsSessionManager manager, bool includeAll)
    {
        var sessions = manager.GetSessions().Select(ReadSession).ToList();
        var target = sessions.FirstOrDefault(session => session.IsNetease);
        var currentRaw = manager.GetCurrentSession();
        var current = currentRaw == null ? null : ReadSession(currentRaw);

        if (target == null)
        {
            if (sessions.Count == 0)
            {
                Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"no_active_session\",\"sessions\":[]}");
                return;
            }

            string json = "{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"no_netease_session\"";
            if (current != null) json += ",\"current\":" + JsonSession(current);
            if (includeAll) json += ",\"sessions\":" + JsonSessions(sessions);
            json += "}";
            Console.WriteLine(json);
            return;
        }

        string result = "{\"ok\":true,\"source\":\"smtc\",\"playing\":" + Bool(target.PlaybackStatus == "Playing")
            + ",\"session\":" + JsonSession(target);
        if (includeAll) result += ",\"sessions\":" + JsonSessions(sessions);
        result += "}";
        Console.WriteLine(result);
    }

    static void WriteSessions(GlobalSystemMediaTransportControlsSessionManager manager)
    {
        var sessions = manager.GetSessions().Select(ReadSession).ToList();
        Console.WriteLine("{\"ok\":true,\"source\":\"smtc\",\"playing\":" + Bool(sessions.Any(s => s.PlaybackStatus == "Playing"))
            + ",\"sessions\":" + JsonSessions(sessions) + "}");
    }

    static void WriteControl(GlobalSystemMediaTransportControlsSessionManager manager, string action, string value)
    {
        var targetRaw = manager.GetSessions().FirstOrDefault(session => IsNeteaseSource(session.SourceAppUserModelId));
        if (targetRaw == null)
        {
            var current = manager.GetCurrentSession();
            string json = "{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"no_netease_session\",\"action\":" + JsonStr(action);
            if (current != null) json += ",\"current\":" + JsonSession(ReadSession(current));
            json += "}";
            Console.WriteLine(json);
            return;
        }

        bool accepted = false;
        switch (action)
        {
            case "play":
                accepted = targetRaw.TryPlayAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "pause":
                accepted = targetRaw.TryPauseAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "toggle":
                accepted = targetRaw.TryTogglePlayPauseAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "next":
                accepted = targetRaw.TrySkipNextAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "prev":
                accepted = targetRaw.TrySkipPreviousAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "stop":
                accepted = targetRaw.TryStopAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "seek":
                double seconds;
                if (!double.TryParse(value, out seconds))
                {
                    Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"invalid_position\",\"action\":\"seek\"}");
                    return;
                }
                accepted = targetRaw.TryChangePlaybackPositionAsync((long)(seconds * TimeSpan.TicksPerSecond))
                    .AsTask()
                    .GetAwaiter()
                    .GetResult();
                break;
            case "rate":
                double rate;
                if (!double.TryParse(value, out rate))
                {
                    Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"invalid_rate\",\"action\":\"rate\"}");
                    return;
                }
                accepted = targetRaw.TryChangePlaybackRateAsync(rate).AsTask().GetAwaiter().GetResult();
                break;
            case "shuffle":
                bool shuffle;
                if (!TryParseBool(value, out shuffle))
                {
                    Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"invalid_shuffle\",\"action\":\"shuffle\"}");
                    return;
                }
                accepted = targetRaw.TryChangeShuffleActiveAsync(shuffle).AsTask().GetAwaiter().GetResult();
                break;
            case "repeat":
                MediaPlaybackAutoRepeatMode mode;
                if (!TryParseRepeatMode(value, out mode))
                {
                    Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"invalid_repeat_mode\",\"action\":\"repeat\"}");
                    return;
                }
                accepted = targetRaw.TryChangeAutoRepeatModeAsync(mode).AsTask().GetAwaiter().GetResult();
                break;
            case "fast-forward":
                accepted = targetRaw.TryFastForwardAsync().AsTask().GetAwaiter().GetResult();
                break;
            case "rewind":
                accepted = targetRaw.TryRewindAsync().AsTask().GetAwaiter().GetResult();
                break;
            default:
                Console.WriteLine("{\"ok\":false,\"source\":\"smtc\",\"playing\":false,\"reason\":\"unknown_action\",\"action\":" + JsonStr(action) + "}");
                return;
        }

        Thread.Sleep(200);
        var session = ReadSession(targetRaw);
        Console.WriteLine("{\"ok\":" + Bool(accepted) + ",\"source\":\"smtc\",\"playing\":" + Bool(session.PlaybackStatus == "Playing")
            + ",\"action\":" + JsonStr(action)
            + ",\"controlSucceeded\":" + Bool(accepted)
            + ",\"session\":" + JsonSession(session) + "}");
    }

    static SessionInfo ReadSession(GlobalSystemMediaTransportControlsSession session)
    {
        var info = new SessionInfo();
        info.SourceAppUserModelId = session.SourceAppUserModelId ?? "";
        info.AppName = AppName(info.SourceAppUserModelId);
        info.IsNetease = IsNeteaseSource(info.SourceAppUserModelId);

        // ── Media Properties ──────────────────────────────────
        try
        {
            var propsTask = session.TryGetMediaPropertiesAsync().AsTask();
            if (propsTask.Wait(3000))
            {
                var props = propsTask.Result;
                info.Title = props.Title ?? "";
                info.Artist = props.Artist ?? "";
                info.Album = props.AlbumTitle ?? "";
                info.AlbumArtist = props.AlbumArtist ?? "";
                info.Subtitle = props.Subtitle ?? "";
                info.Genres = props.Genres != null ? string.Join(", ", props.Genres) : "";
                info.TrackNumber = props.TrackNumber;
                info.AlbumTrackCount = props.AlbumTrackCount;
                info.PlaybackType = (props.PlaybackType ?? MediaPlaybackType.Unknown).ToString();

                // Thumbnail: save to temp file
                try
                {
                    var thumbTask = props.Thumbnail?.OpenReadAsync()?.AsTask();
                    if (thumbTask != null && thumbTask.Wait(2000))
                    {
                        var stream = thumbTask.Result;
                        if (stream != null && stream.Size > 0)
                        {
                            info.HasThumbnail = true;
                            string thumbDir = Path.Combine(Path.GetTempPath(), "nm-smtc-thumb");
                            Directory.CreateDirectory(thumbDir);
                            string fileName = $"{info.Title}_{info.Artist}.jpg";
                            foreach (char c in Path.GetInvalidFileNameChars())
                                fileName = fileName.Replace(c, '_');
                            string thumbPath = Path.Combine(thumbDir, fileName);
                            using (var inputStream = stream.GetInputStreamAt(0))
                            using (var dataReader = new DataReader(inputStream))
                            {
                                var loadTask = dataReader.LoadAsync((uint)stream.Size).AsTask();
                                if (loadTask.Wait(2000))
                                {
                                    var buf = new byte[stream.Size];
                                    dataReader.ReadBytes(buf);
                                    File.WriteAllBytes(thumbPath, buf);
                                }
                            }
                            info.ThumbnailPath = thumbPath;
                        }
                    }
                }
                catch { }
            }
        }
        catch { }

        // ── Playback Info & Individual Control Capabilities ──
        try
        {
            var playback = session.GetPlaybackInfo();
            if (playback != null)
            {
                info.PlaybackStatus = playback.PlaybackStatus.ToString();
                var controls = playback.Controls;
                if (controls != null)
                {
                    info.CanPlay = controls.IsPlayEnabled;
                    info.CanPause = controls.IsPauseEnabled;
                    info.CanNext = controls.IsNextEnabled;
                    info.CanPrev = controls.IsPreviousEnabled;
                    info.CanStop = controls.IsStopEnabled;
                    info.CanSeek = controls.IsPlaybackPositionEnabled;
                    info.CanShuffle = controls.IsShuffleEnabled;
                    info.CanRepeat = controls.IsRepeatEnabled;
                    info.CanFastForward = controls.IsFastForwardEnabled;
                    info.CanRewind = controls.IsRewindEnabled;
                    info.CanRate = controls.IsPlaybackRateEnabled;
                }
            }
        }
        catch { }

        // ── Timeline Properties ───────────────────────────────
        try
        {
            var timeline = session.GetTimelineProperties();
            if (timeline != null)
            {
                info.Position = Math.Round(timeline.Position.TotalSeconds);
                info.Duration = Math.Round(timeline.EndTime.TotalSeconds);
                info.StartTime = Math.Round(timeline.StartTime.TotalSeconds);
                info.MinSeekTime = Math.Round(timeline.MinSeekTime.TotalSeconds);
                info.MaxSeekTime = Math.Round(timeline.MaxSeekTime.TotalSeconds);
                // PlaybackRate is not available in the targeted Windows SDK version
            }
        }
        catch { }

        return info;
    }

    static string AppName(string source)
    {
        if (string.IsNullOrEmpty(source)) return "unknown";
        int bang = source.IndexOf('!');
        return bang > 0 ? source.Substring(0, bang) : source;
    }

    static bool IsNeteaseSource(string source)
    {
        if (string.IsNullOrEmpty(source)) return false;
        return source.IndexOf("cloudmusic", StringComparison.OrdinalIgnoreCase) >= 0
            || source.IndexOf("netease", StringComparison.OrdinalIgnoreCase) >= 0
            || source.IndexOf("orpheus", StringComparison.OrdinalIgnoreCase) >= 0;
    }

    static bool TryParseBool(string value, out bool result)
    {
        if (bool.TryParse(value, out result)) return true;
        if (value == "1" || value.Equals("yes", StringComparison.OrdinalIgnoreCase) || value.Equals("on", StringComparison.OrdinalIgnoreCase))
        {
            result = true;
            return true;
        }
        if (value == "0" || value.Equals("no", StringComparison.OrdinalIgnoreCase) || value.Equals("off", StringComparison.OrdinalIgnoreCase))
        {
            result = false;
            return true;
        }
        result = false;
        return false;
    }

    static bool TryParseRepeatMode(string value, out MediaPlaybackAutoRepeatMode mode)
    {
        switch ((value ?? "").ToLowerInvariant())
        {
            case "none":
            case "off":
                mode = MediaPlaybackAutoRepeatMode.None;
                return true;
            case "one":
            case "track":
                mode = MediaPlaybackAutoRepeatMode.Track;
                return true;
            case "all":
            case "list":
                mode = MediaPlaybackAutoRepeatMode.List;
                return true;
            default:
                mode = MediaPlaybackAutoRepeatMode.None;
                return false;
        }
    }

    static string JsonSession(SessionInfo session)
    {
        return "{"
            + "\"sourceAppUserModelId\":" + JsonStr(session.SourceAppUserModelId) + ","
            + "\"appName\":" + JsonStr(session.AppName) + ","
            + "\"isNetease\":" + Bool(session.IsNetease) + ","
            + "\"song\":{"
            + "\"title\":" + JsonStr(session.Title)
            + ",\"artist\":" + JsonStr(session.Artist)
            + ",\"album\":" + JsonStr(session.Album)
            + ",\"albumArtist\":" + JsonStr(session.AlbumArtist)
            + ",\"genres\":" + JsonStr(session.Genres)
            + ",\"subtitle\":" + JsonStr(session.Subtitle)
            + ",\"trackNumber\":" + session.TrackNumber.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + ",\"albumTrackCount\":" + session.AlbumTrackCount.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + ",\"playbackType\":" + JsonStr(session.PlaybackType)
            + ",\"hasThumbnail\":" + Bool(session.HasThumbnail)
            + ",\"thumbnailPath\":" + JsonStr(session.ThumbnailPath)
            + "},"
            + "\"playbackStatus\":" + JsonStr(session.PlaybackStatus) + ","
            + "\"position\":" + session.Position.ToString(System.Globalization.CultureInfo.InvariantCulture) + ","
            + "\"duration\":" + session.Duration.ToString(System.Globalization.CultureInfo.InvariantCulture) + ","
            + "\"startTime\":" + session.StartTime.ToString(System.Globalization.CultureInfo.InvariantCulture) + ","
            + "\"minSeekTime\":" + session.MinSeekTime.ToString(System.Globalization.CultureInfo.InvariantCulture) + ","
            + "\"maxSeekTime\":" + session.MaxSeekTime.ToString(System.Globalization.CultureInfo.InvariantCulture) + ","
            + "\"playbackRate\":" + session.PlaybackRate.ToString(System.Globalization.CultureInfo.InvariantCulture) + ","
            + "\"controls\":{"
            + "\"canPlay\":" + Bool(session.CanPlay)
            + ",\"canPause\":" + Bool(session.CanPause)
            + ",\"canNext\":" + Bool(session.CanNext)
            + ",\"canPrev\":" + Bool(session.CanPrev)
            + ",\"canStop\":" + Bool(session.CanStop)
            + ",\"canSeek\":" + Bool(session.CanSeek)
            + ",\"canShuffle\":" + Bool(session.CanShuffle)
            + ",\"canRepeat\":" + Bool(session.CanRepeat)
            + ",\"canFastForward\":" + Bool(session.CanFastForward)
            + ",\"canRewind\":" + Bool(session.CanRewind)
            + ",\"canRate\":" + Bool(session.CanRate)
            + "}"
            + "}";
    }

    static string JsonSessions(List<SessionInfo> sessions)
    {
        return "[" + string.Join(",", sessions.Select(JsonSession)) + "]";
    }

    static string Bool(bool value)
    {
        return value ? "true" : "false";
    }

    static string JsonStr(string value)
    {
        if (value == null) return "null";
        return "\"" + value.Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r", "")
            .Replace("\n", "\\n")
            .Replace("\t", "\\t") + "\"";
    }
}
