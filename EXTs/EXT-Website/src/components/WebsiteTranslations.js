/**********************
/** WebSite Translations *
/*********************/

/* eslint-disable-next-line */
class WebsiteTranslations {
  constructor (Tools) {
    this.translate = (...args) => Tools.translate(...args);

    this.EXTTranslate = {};
    this.EXTDescription = {};
    this.VALTranslate = {};
    console.log("[WEBSITE] WebsiteEXTs Ready");
  }

  async init () {
    await this.Load_EXT_Translation();
    await this.Load_EXT_Description();
    await this.Load_EXT_TrSchemaValidation();
    return true;
  }

  /** translations **/
  Load_EXT_Translation () {
    return new Promise((resolve) => {
      this.EXTTranslate.Rotate_Msg = this.translate("GW_Rotate_Msg");
      this.EXTTranslate.Rotate_Continue = this.translate("GW_Rotate_Continue");

      this.EXTTranslate.Login_Welcome = this.translate("GW_Login_Welcome");
      this.EXTTranslate.Login_Username = this.translate("GW_Login_Username");
      this.EXTTranslate.Login_Password = this.translate("GW_Login_Password");
      this.EXTTranslate.Login_Error = this.translate("GW_Login_Error");
      this.EXTTranslate.Login_Login = this.translate("GW_Login_Login");

      this.EXTTranslate.Home = this.translate("GW_Home");
      this.EXTTranslate.Home_Welcome = this.translate("GW_Home_Welcome");

      this.EXTTranslate.Plugins = this.translate("GW_Plugins");
      this.EXTTranslate.Plugins_Welcome = this.translate("GW_Plugins_Welcome");
      this.EXTTranslate.Plugins_Table_Reset = this.translate("GW_Plugins_Table_Reset");
      this.EXTTranslate.Plugins_Table_Showing = this.translate("GW_Plugins_Table_Showing");
      this.EXTTranslate.Plugins_Table_Plugins = this.translate("GW_Plugins_Table_Plugins");
      this.EXTTranslate.Plugins_Table_Name = this.translate("GW_Plugins_Table_Name");
      this.EXTTranslate.Plugins_Table_Description = this.translate("GW_Plugins_Table_Description");
      this.EXTTranslate.Plugins_Table_Actions = this.translate("GW_Plugins_Table_Actions");
      this.EXTTranslate.Plugins_Table_Configuration = this.translate("GW_Plugins_Table_Configuration");
      this.EXTTranslate.Plugins_Table_Search = this.translate("GW_Plugins_Table_Search");
      this.EXTTranslate.Plugins_Table_Wiki = this.translate("GW_Plugins_Table_Wiki");
      this.EXTTranslate.Plugins_Table_Install = this.translate("GW_Plugins_Table_Install");
      this.EXTTranslate.Plugins_Table_Delete = this.translate("GW_Plugins_Table_Delete");
      this.EXTTranslate.Plugins_Table_Modify = this.translate("GW_Plugins_Table_Modify");
      this.EXTTranslate.Plugins_Table_Configure = this.translate("GW_Plugins_Table_Configure");
      this.EXTTranslate.Plugins_Table_DeleteConfig = this.translate("GW_Plugins_Table_DeleteConfig");
      this.EXTTranslate.Plugins_Delete_TerminalHeader = this.translate("GW_Plugins_Delete_TerminalHeader");
      this.EXTTranslate.Plugins_Delete_Message = this.translate("GW_Plugins_Delete_Message");
      this.EXTTranslate.Plugins_Delete_Progress = this.translate("GW_Plugins_Delete_Progress");
      this.EXTTranslate.Plugins_Delete_Confirmed = this.translate("GW_Plugins_Delete_Confirmed");
      this.EXTTranslate.Plugins_Install_TerminalHeader = this.translate("GW_Plugins_Install_TerminalHeader");
      this.EXTTranslate.Plugins_Install_Message = this.translate("GW_Plugins_Install_Message");
      this.EXTTranslate.Plugins_Install_Progress = this.translate("GW_Plugins_Install_Progress");
      this.EXTTranslate.Plugins_Install_Confirmed = this.translate("GW_Plugins_Install_Confirmed");
      this.EXTTranslate.Plugins_Initial_Title = this.translate("GW_Plugins_Initial_Title");
      this.EXTTranslate.Plugins_DeleteConfig_Title = this.translate("GW_Plugins_DeleteConfig_Title");
      this.EXTTranslate.Plugins_DeleteConfig_Confirmed = this.translate("GW_Plugins_DeleteConfig_Confirmed");
      this.EXTTranslate.Plugins_Modify_Title = this.translate("GW_Plugins_Modify_Title");
      this.EXTTranslate.Plugins_Error_Snowboy = this.translate("GW_Plugins_Error_Snowboy");
      this.EXTTranslate.Plugins_Error_Porcupine = this.translate("GW_Plugins_Error_Porcupine");

      this.EXTTranslate.Terminal = this.translate("GW_Terminal");
      this.EXTTranslate.TerminalOpen = this.translate("GW_TerminalOpen");
      this.EXTTranslate.TerminalGW = this.translate("GW_TerminalGW");

      this.EXTTranslate.Configuration = this.translate("GW_Configuration");
      this.EXTTranslate.Configuration_Welcome = this.translate("GW_Configuration_Welcome");
      this.EXTTranslate.Configuration_EditLoad = this.translate("GW_Configuration_EditLoad");
      this.EXTTranslate.Configuration_Edit_Title = this.translate("GW_Configuration_Edit_Title");
      this.EXTTranslate.Configuration_Edit_AcualConfig = this.translate("GW_Configuration_Edit_AcualConfig");

      this.EXTTranslate.Tools = this.translate("GW_Tools");
      this.EXTTranslate.Tools_Welcome = this.translate("GW_Tools_Welcome");
      this.EXTTranslate.Tools_subTitle = this.translate("GW_Tools_subTitle");
      this.EXTTranslate.Tools_Restart = this.translate("GW_Tools_Restart");
      this.EXTTranslate.Tools_Restart_Text1 = this.translate("GW_Tools_Restart_Text1");
      this.EXTTranslate.Tools_Restart_Text2 = this.translate("GW_Tools_Restart_Text2");
      this.EXTTranslate.Tools_Die = this.translate("GW_Tools_Die");
      this.EXTTranslate.Tools_Die_Text1 = this.translate("GW_Tools_Die_Text1");
      this.EXTTranslate.Tools_Die_Text2 = this.translate("GW_Tools_Die_Text2");
      this.EXTTranslate.Tools_Die_Text3 = this.translate("GW_Tools_Die_Text3");
      this.EXTTranslate.Tools_Webview_Header = this.translate("GW_Tools_Webview_Header");
      this.EXTTranslate.Tools_Webview_Needed = this.translate("GW_Tools_Webview_Needed");
      this.EXTTranslate.Tools_Backup_Found = this.translate("GW_Tools_Backup_Found");
      this.EXTTranslate.Tools_Backup_Text = this.translate("GW_Tools_Backup_Text");
      this.EXTTranslate.Tools_Backup_Deleted = this.translate("GW_Tools_Backup_Deleted");
      this.EXTTranslate.Tools_Screen_Text = this.translate("GW_Tools_Screen_Text");
      this.EXTTranslate.Tools_GoogleAssistant_Text = this.translate("GW_Tools_GoogleAssistant_Text");
      this.EXTTranslate.Tools_GoogleAssistant_Query = this.translate("GW_Tools_GoogleAssistant_Query");
      this.EXTTranslate.Tools_Alert_Text = this.translate("GW_Tools_Alert_Text");
      this.EXTTranslate.Tools_Alert_Query = this.translate("GW_Tools_Alert_Query");
      this.EXTTranslate.Tools_Volume_Text_Record = this.translate("GW_Tools_Volume_Text_Record");
      this.EXTTranslate.Tools_Volume_Text = this.translate("GW_Tools_Volume_Text");
      this.EXTTranslate.Tools_Volume_Text2 = this.translate("GW_Tools_Volume_Text2");
      this.EXTTranslate.Tools_Volume_Text3 = this.translate("GW_Tools_Volume_Text3");
      this.EXTTranslate.Tools_Spotify_Text = this.translate("GW_Tools_Spotify_Text");
      this.EXTTranslate.Tools_Spotify_Text2 = this.translate("GW_Tools_Spotify_Text2");
      this.EXTTranslate.Tools_Spotify_Query = this.translate("GW_Tools_Spotify_Query");
      this.EXTTranslate.Tools_Spotify_Artist = this.translate("GW_Tools_Spotify_Artist");
      this.EXTTranslate.Tools_Spotify_Track = this.translate("GW_Tools_Spotify_Track");
      this.EXTTranslate.Tools_Spotify_Album = this.translate("GW_Tools_Spotify_Album");
      this.EXTTranslate.Tools_Spotify_Playlist = this.translate("GW_Tools_Spotify_Playlist");
      this.EXTTranslate.Tools_Update_Header = this.translate("GW_Tools_Update_Header");
      this.EXTTranslate.Tools_Update_Text = this.translate("GW_Tools_Update_Text");
      this.EXTTranslate.Tools_Update_Text2 = this.translate("GW_Tools_Update_Text2");
      this.EXTTranslate.Tools_YouTube_Text = this.translate("GW_Tools_YouTube_Text");
      this.EXTTranslate.Tools_YouTube_Query = this.translate("GW_Tools_YouTube_Query");
      this.EXTTranslate.Tools_Stop_Text = this.translate("GW_Tools_Stop_Text");
      this.EXTTranslate.Tools_Radio_Text = this.translate("GW_Tools_Radio_Text");
      this.EXTTranslate.Tools_Radio_Text2 = this.translate("GW_Tools_Radio_Text2");

      this.EXTTranslate.About = this.translate("GW_About");
      this.EXTTranslate.About_Title = this.translate("GW_About_Title");
      this.EXTTranslate.About_Info_by = this.translate("GW_About_Info_by");
      this.EXTTranslate.About_Info_Support = this.translate("GW_About_Info_Support");
      this.EXTTranslate.About_Info_Donate = this.translate("GW_About_Info_Donate");
      this.EXTTranslate.About_Info_Donate_Text = this.translate("GW_About_Info_Donate_Text");
      this.EXTTranslate.About_Info_About = this.translate("GW_About_Info_About");
      this.EXTTranslate.About_Info_Translator = this.translate("GW_About_Info_Translator");
      this.EXTTranslate.About_Info_Translator1 = this.translate("GW_About_Info_Translator1");
      this.EXTTranslate.About_Info_Translator2 = this.translate("GW_About_Info_Translator2");
      this.EXTTranslate.About_Info_Translator3 = this.translate("GW_About_Info_Translator3");
      this.EXTTranslate.About_Info_Translator4 = this.translate("GW_About_Info_Translator4");
      this.EXTTranslate.About_Info_Translator5 = this.translate("GW_About_Info_Translator5");
      this.EXTTranslate.About_Info_Translator6 = this.translate("GW_About_Info_Translator6");
      this.EXTTranslate.About_Info_Translator7 = this.translate("GW_About_Info_Translator7");
      this.EXTTranslate.About_Info_Translator8 = this.translate("GW_About_Info_Translator8");
      this.EXTTranslate.About_Info_Translator9 = this.translate("GW_About_Info_Translator9");
      this.EXTTranslate.About_Info_Translator10 = this.translate("GW_About_Info_Translator10");

      this.EXTTranslate.System = this.translate("GW_System");
      this.EXTTranslate.System_Box_Shutdown = this.translate("GW_System_Box_Shutdown");
      this.EXTTranslate.System_Shutdown = this.translate("GW_System_Shutdown");
      this.EXTTranslate.System_Box_Restart = this.translate("GW_System_Box_Restart");
      this.EXTTranslate.System_Restart = this.translate("GW_System_Restart");
      this.EXTTranslate.System_Box_Version = this.translate("GW_System_Box_Version");
      this.EXTTranslate.System_GPUAcceleration_Disabled = this.translate("GW_System_GPUAcceleration_Disabled");
      this.EXTTranslate.System_GPUAcceleration_Enabled = this.translate("GW_System_GPUAcceleration_Enabled");
      this.EXTTranslate.System_NodeVersion = this.translate("GW_System_NodeVersion");
      this.EXTTranslate.System_NPMVersion = this.translate("GW_System_NPMVersion");
      this.EXTTranslate.System_OSVersion = this.translate("GW_System_OSVersion");
      this.EXTTranslate.System_KernelVersion = this.translate("GW_System_KernelVersion");
      this.EXTTranslate.System_CPUSystem = this.translate("GW_System_CPUSystem");
      this.EXTTranslate.System_TypeCPU = this.translate("GW_System_TypeCPU");
      this.EXTTranslate.System_SpeedCPU = this.translate("GW_System_SpeedCPU");
      this.EXTTranslate.System_CurrentLoadCPU = this.translate("GW_System_CurrentLoadCPU");
      this.EXTTranslate.System_GovernorCPU = this.translate("GW_System_GovernorCPU");
      this.EXTTranslate.System_TempCPU = this.translate("GW_System_TempCPU");
      this.EXTTranslate.System_MemorySystem = this.translate("GW_System_MemorySystem");
      this.EXTTranslate.System_TypeMemory = this.translate("GW_System_TypeMemory");
      this.EXTTranslate.System_SwapMemory = this.translate("GW_System_SwapMemory");
      this.EXTTranslate.System_NetworkSystem = this.translate("GW_System_NetworkSystem");
      this.EXTTranslate.System_IPNetwork = this.translate("GW_System_IPNetwork");
      this.EXTTranslate.System_InterfaceNetwork = this.translate("GW_System_InterfaceNetwork");
      this.EXTTranslate.System_SpeedNetwork = this.translate("GW_System_SpeedNetwork");
      this.EXTTranslate.System_DuplexNetwork = this.translate("GW_System_DuplexNetwork");
      this.EXTTranslate.System_WirelessInfo = this.translate("GW_System_WirelessInfo");
      this.EXTTranslate.System_SSIDNetwork = this.translate("GW_System_SSIDNetwork");
      this.EXTTranslate.System_RateNetwork = this.translate("GW_System_RateNetwork");
      this.EXTTranslate.System_FrequencyNetwork = this.translate("GW_System_FrequencyNetwork");
      this.EXTTranslate.System_SignalNetwork = this.translate("GW_System_SignalNetwork");
      this.EXTTranslate.System_QualityNetwork = this.translate("GW_System_QualityNetwork");
      this.EXTTranslate.System_StorageSystem = this.translate("GW_System_StorageSystem");
      this.EXTTranslate.System_MountStorage = this.translate("GW_System_MountStorage");
      this.EXTTranslate.System_UsedStorage = this.translate("GW_System_UsedStorage");
      this.EXTTranslate.System_PercentStorage = this.translate("GW_System_PercentStorage");
      this.EXTTranslate.System_TotalStorage = this.translate("GW_System_TotalStorage");
      this.EXTTranslate.System_UptimeSystem = this.translate("GW_System_UptimeSystem");
      this.EXTTranslate.System_CurrentUptime = this.translate("GW_System_CurrentUptime");
      this.EXTTranslate.System_System = this.translate("GW_System_System");
      this.EXTTranslate.System_RecordUptime = this.translate("GW_System_RecordUptime");
      this.EXTTranslate.System_DAY = this.translate("GW_System_DAY");
      this.EXTTranslate.System_DAYS = this.translate("GW_System_DAYS");
      this.EXTTranslate.System_HOUR = this.translate("GW_System_HOUR");
      this.EXTTranslate.System_HOURS = this.translate("GW_System_HOURS");
      this.EXTTranslate.System_MINUTE = this.translate("GW_System_MINUTE");
      this.EXTTranslate.System_MINUTES = this.translate("GW_System_MINUTES");
      this.EXTTranslate.System_ProcessSystem = this.translate("GW_System_ProcessSystem");
      this.EXTTranslate.System_CPU = this.translate("GW_System_CPU");
      this.EXTTranslate.System_Memory = this.translate("GW_System_Memory");
      this.EXTTranslate.System_CurrentlyRunning = this.translate("GW_System_CurrentlyRunning");
      this.EXTTranslate.System_NoPlugins = this.translate("GW_System_NoPlugins");
      this.EXTTranslate.System_NamePlugin = this.translate("GW_System_NamePlugin");
      this.EXTTranslate.System_VersionPlugin = this.translate("GW_System_VersionPlugin");
      this.EXTTranslate.System_RevPlugin = this.translate("GW_System_RevPlugin");

      this.EXTTranslate.Logout = this.translate("GW_Logout");

      this.EXTTranslate.Delete = this.translate("GW_Delete"),
      this.EXTTranslate.Install = this.translate("GW_Install"),
      this.EXTTranslate.Configure = this.translate("GW_Configure"),
      this.EXTTranslate.Modify = this.translate("GW_Modify");
      this.EXTTranslate.Save = this.translate("GW_Save");
      this.EXTTranslate.Wait = this.translate("GW_Wait");
      this.EXTTranslate.Done = this.translate("GW_Done");
      this.EXTTranslate.Error = this.translate("GW_Error");
      this.EXTTranslate.Cancel = this.translate("GW_Cancel");
      this.EXTTranslate.Confirm = this.translate("GW_Confirm");
      this.EXTTranslate.Load = this.translate("GW_Load");
      this.EXTTranslate.Restart = this.translate("GW_Restart");
      this.EXTTranslate.ErrModule = this.translate("GW_ErrModule");
      this.EXTTranslate.Warn_Error = this.translate("GW_Warn_Error");
      this.EXTTranslate.LoadDefault = this.translate("GW_LoadDefault"),
      this.EXTTranslate.MergeDefault = this.translate("GW_MergeDefault");
      this.EXTTranslate.Send = this.translate("GW_Send");
      this.EXTTranslate.TurnOn = this.translate("GW_TurnOn");
      this.EXTTranslate.TurnOff = this.translate("GW_TurnOff");
      this.EXTTranslate.RequestDone = this.translate("GW_RequestDone");
      this.EXTTranslate.Listen = this.translate("GW_Listen");
      this.EXTTranslate.Update = this.translate("GW_Update");
      this.EXTTranslate.Start = this.translate("GW_Start");
      resolve();
    });
  }

  Get_EXT_Translation () {
    return this.EXTTranslate;
  }

  /** load descriptions **/
  Load_EXT_Description () {
    return new Promise((resolve) => {
      this.EXTDescription["EXT-Background"] = this.translate("EXT-Background");
      this.EXTDescription["EXT-Browser"] = this.translate("EXT-Browser");
      this.EXTDescription["EXT-Detector"] = this.translate("EXT-Detector");
      this.EXTDescription["EXT-FreeboxTV"] = this.translate("EXT-FreeboxTV");
      this.EXTDescription["EXT-GooglePhotos"] = this.translate("EXT-GooglePhotos");
      this.EXTDescription["EXT-Keyboard"] = this.translate("EXT-Keyboard");
      this.EXTDescription["EXT-Librespot"] = this.translate("EXT-Librespot");
      this.EXTDescription["EXT-MusicPlayer"] = this.translate("EXT-MusicPlayer");
      this.EXTDescription["EXT-Pages"] = this.translate("EXT-Pages");
      this.EXTDescription["EXT-Photos"] = this.translate("EXT-Photos");
      this.EXTDescription["EXT-RadioPlayer"] = this.translate("EXT-RadioPlayer");
      this.EXTDescription["EXT-Screen"] = this.translate("EXT-Screen");
      this.EXTDescription["EXT-SmartHome"] = this.translate("EXT-SmartHome");
      this.EXTDescription["EXT-Spotify"] = this.translate("EXT-Spotify");
      this.EXTDescription["EXT-StreamDeck"] = this.translate("EXT-StreamDeck");
      this.EXTDescription["EXT-TelegramBot"] = this.translate("EXT-TelegramBot");
      this.EXTDescription["EXT-Touch"] = this.translate("EXT-Touch");
      this.EXTDescription["EXT-Updates"] = this.translate("EXT-Updates");
      this.EXTDescription["EXT-VLCServer"] = this.translate("EXT-VLCServer");
      this.EXTDescription["EXT-Volume"] = this.translate("EXT-Volume");
      this.EXTDescription["EXT-Website"] = this.translate("EXT-Website");
      this.EXTDescription["EXT-Welcome"] = this.translate("EXT-Welcome");
      this.EXTDescription["EXT-YouTube"] = this.translate("EXT-YouTube");
      this.EXTDescription["EXT-YouTubeCast"] = this.translate("EXT-YouTubeCast");
      resolve();
    });
  }

  Get_EXT_Description () {
    return this.EXTDescription;
  }

  /** load schema validation translations **/
  Load_EXT_TrSchemaValidation () {
    return new Promise((resolve) => {
      this.VALTranslate.PluginDescription = this.translate("VAL_PluginDescription");
      this.VALTranslate.PluginName = this.translate("VAL_PluginName");
      this.VALTranslate.PluginAnimateIn = this.translate("VAL_PluginAnimateIn");
      this.VALTranslate.PluginAnimateOut = this.translate("VAL_PluginAnimateOut");
      this.VALTranslate.PluginDisable = this.translate("VAL_PluginDisable");
      this.VALTranslate.PluginPosition = this.translate("VAL_PluginPosition");
      this.VALTranslate.PluginConfigDeepMerge = this.translate("VAL_PluginConfigDeepMerge");
      this.VALTranslate.PluginConfiguration = this.translate("VAL_PluginConfiguration");
      this.VALTranslate.PluginDebug = this.translate("VAL_PluginDebug");
      this.VALTranslate["EXT-Background_Model"] = this.translate("VAL_EXT-Background_Model");
      this.VALTranslate["EXT-Background_Image"] = this.translate("VAL_EXT-Background_Image");
      this.VALTranslate["EXT-Browser_Delay"] = this.translate("VAL_EXT-Browser_Delay");
      this.VALTranslate["EXT-Browser_Scroll"] = this.translate("VAL_EXT-Browser_Scroll");
      this.VALTranslate["EXT-Browser_Step"] = this.translate("VAL_EXT-Browser_Step");
      this.VALTranslate["EXT-Browser_Interval"] = this.translate("VAL_EXT-Browser_Interval");
      this.VALTranslate["EXT-Browser_Start"] = this.translate("VAL_EXT-Browser_Start");
      this.VALTranslate["EXT-Detector_Icon"] = this.translate("VAL_EXT-Detector_Icon");
      this.VALTranslate["EXT-Detector_Touch"] = this.translate("VAL_EXT-Detector_Touch");
      this.VALTranslate["EXT-Detector_Detector"] = this.translate("VAL_EXT-Detector_Detector");
      this.VALTranslate["EXT-Detector_Engine"] = this.translate("VAL_EXT-Detector_Engine");
      this.VALTranslate["EXT-Detector_Keyword"] = this.translate("VAL_EXT-Detector_Keyword");
      this.VALTranslate["EXT-Detector_Sensitivity"] = this.translate("VAL_EXT-Detector_Sensitivity");
      this.VALTranslate["EXT-Detector_AccessKey"] = this.translate("VAL_EXT-Detector_AccessKey");
      this.VALTranslate["EXT-Detector_CustomModel"] = this.translate("VAL_EXT-Detector_CustomModel");
      this.VALTranslate["EXT-GooglePhotos_Type"] = this.translate("VAL_EXT-GooglePhotos_Type");
      this.VALTranslate["EXT-GooglePhotos_Delay"] = this.translate("VAL_EXT-GooglePhotos_Delay");
      this.VALTranslate["EXT-GooglePhotos_Infos"] = this.translate("VAL_EXT-GooglePhotos_Infos");
      this.VALTranslate["EXT-GooglePhotos_Albums"] = this.translate("VAL_EXT-GooglePhotos_Albums");
      this.VALTranslate["EXT-GooglePhotos_Background"] = this.translate("VAL_EXT-GooglePhotos_Background");
      this.VALTranslate["EXT-GooglePhotos_Sort"] = this.translate("VAL_EXT-GooglePhotos_Sort");
      this.VALTranslate["EXT-GooglePhotos_HD"] = this.translate("VAL_EXT-GooglePhotos_HD");
      this.VALTranslate["EXT-GooglePhotos_Format"] = this.translate("VAL_EXT-GooglePhotos_Format");
      this.VALTranslate["EXT-GooglePhotos_Height"] = this.translate("VAL_EXT-GooglePhotos_Height");
      this.VALTranslate["EXT-GooglePhotos_Width"] = this.translate("VAL_EXT-GooglePhotos_Width");
      this.VALTranslate["EXT-GooglePhotos_uploadAlbum"] = this.translate("VAL_EXT-GooglePhotos_uploadAlbum");
      this.VALTranslate["EXT-Keyboard_keyFinder"] = this.translate("VAL_EXT-Keyboard_keyFinder");
      this.VALTranslate["EXT-Keyboard_keys"] = this.translate("VAL_EXT-Keyboard_keys");
      this.VALTranslate["EXT-Keyboard_keycode"] = this.translate("VAL_EXT-Keyboard_keycode");
      this.VALTranslate["EXT-Keyboard_notification"] = this.translate("VAL_EXT-Keyboard_notification");
      this.VALTranslate["EXT-Keyboard_payload"] = this.translate("VAL_EXT-Keyboard_payload");
      this.VALTranslate["EXT-Keyboard_command"] = this.translate("VAL_EXT-Keyboard_command");
      this.VALTranslate["EXT-Keyboard_sound"] = this.translate("VAL_EXT-Keyboard_sound");
      this.VALTranslate["EXT-Librespot_Name"] = this.translate("VAL_EXT-Librespot_Name");
      this.VALTranslate["EXT-Librespot_Min"] = this.translate("VAL_EXT-Librespot_Min");
      this.VALTranslate["EXT-Librespot_Max"] = this.translate("VAL_EXT-Librespot_Max");
      this.VALTranslate["EXT-MusicPlayer_USB"] = this.translate("VAL_EXT-MusicPlayer_USB");
      this.VALTranslate["EXT-MusicPlayer_Path"] = this.translate("VAL_EXT-MusicPlayer_Path");
      this.VALTranslate["EXT-MusicPlayer_Check"] = this.translate("VAL_EXT-MusicPlayer_Check");
      this.VALTranslate["EXT-MusicPlayer_Start"] = this.translate("VAL_EXT-MusicPlayer_Start");
      this.VALTranslate["EXT-MusicPlayer_Min"] = this.translate("VAL_EXT-MusicPlayer_Min");
      this.VALTranslate["EXT-MusicPlayer_Max"] = this.translate("VAL_EXT-MusicPlayer_Max");
      this.VALTranslate["EXT-Pages_pages"] = this.translate("VAL_EXT-Pages_pages");
      this.VALTranslate["EXT-Pages_fixed"] = this.translate("VAL_EXT-Pages_fixed");
      this.VALTranslate["EXT-Pages_hiddenPages"] = this.translate("VAL_EXT-Pages_hiddenPages");
      this.VALTranslate["EXT-Pages_animateIn"] = this.translate("VAL_EXT-Pages_animateIn");
      this.VALTranslate["EXT-Pages_rotationTime"] = this.translate("VAL_EXT-Pages_rotationTime");
      this.VALTranslate["EXT-Pages_rotationTimes"] = this.translate("VAL_EXT-Pages_rotationTimes");
      this.VALTranslate["EXT-Pages_homePage"] = this.translate("VAL_EXT-Pages_homePage");
      this.VALTranslate["EXT-Pages_indicator"] = this.translate("VAL_EXT-Pages_indicator");
      this.VALTranslate["EXT-Pages_hideBeforeRotation"] = this.translate("VAL_EXT-Pages_hideBeforeRotation");
      this.VALTranslate["EXT-Pages_Gateway"] = this.translate("VAL_EXT-Pages_Gateway");
      this.VALTranslate["EXT-Pages_loading"] = this.translate("VAL_EXT-Pages_loading");
      this.VALTranslate["EXT-Photos_Delay"] = this.translate("VAL_EXT-Photos_Delay");
      this.VALTranslate["EXT-Photos_Loop"] = this.translate("VAL_EXT-Photos_Loop");
      this.VALTranslate["EXT-RadioPlayer_Min"] = this.translate("VAL_EXT-RadioPlayer_Min");
      this.VALTranslate["EXT-RadioPlayer_Max"] = this.translate("VAL_EXT-RadioPlayer_Max");
      this.VALTranslate["EXT-Screen_Sleeping"] = this.translate("VAL_EXT-Screen_Sleeping");
      this.VALTranslate["EXT-SmartHome_username"] = this.translate("VAL_EXT-SmartHome_username");
      this.VALTranslate["EXT-SmartHome_password"] = this.translate("VAL_EXT-SmartHome_password");
      this.VALTranslate["EXT-SmartHome_CLIENTID"] = this.translate("VAL_EXT-SmartHome_CLIENTID");
      this.VALTranslate["EXT-Spotify_Interval"] = this.translate("VAL_EXT-Spotify_Interval");
      this.VALTranslate["EXT-Spotify_Idle"] = this.translate("VAL_EXT-Spotify_Idle");
      this.VALTranslate["EXT-Spotify_BottomBar"] = this.translate("VAL_EXT-Spotify_BottomBar");
      this.VALTranslate["EXT-Spotify_ID"] = this.translate("VAL_EXT-Spotify_ID");
      this.VALTranslate["EXT-Spotify_Secret"] = this.translate("VAL_EXT-Spotify_Secret");
      this.VALTranslate["EXT-StreamDeck_device"] = this.translate("VAL_EXT-StreamDeck_device");
      this.VALTranslate["EXT-StreamDeck_brightness"] = this.translate("VAL_EXT-StreamDeck_brightness");
      this.VALTranslate["EXT-StreamDeck_ecobrightness"] = this.translate("VAL_EXT-StreamDeck_ecobrightness");
      this.VALTranslate["EXT-StreamDeck_ecotime"] = this.translate("VAL_EXT-StreamDeck_ecotime");
      this.VALTranslate["EXT-StreamDeck_logo"] = this.translate("VAL_EXT-StreamDeck_logo");
      this.VALTranslate["EXT-TelegramBot_telegramAPIKey"] = this.translate("VAL_EXT-TelegramBot_telegramAPIKey");
      this.VALTranslate["EXT-TelegramBot_adminChatId"] = this.translate("VAL_EXT-TelegramBot_adminChatId");
      this.VALTranslate["EXT-TelegramBot_allowedUser"] = this.translate("VAL_EXT-TelegramBot_allowedUser");
      this.VALTranslate["EXT-TelegramBot_commandAllowed"] = this.translate("VAL_EXT-TelegramBot_commandAllowed");
      this.VALTranslate["EXT-TelegramBot_useWelcomeMessage"] = this.translate("VAL_EXT-TelegramBot_useWelcomeMessage");
      this.VALTranslate["EXT-TelegramBot_useSoundNotification"] = this.translate("VAL_EXT-TelegramBot_useSoundNotification");
      this.VALTranslate["EXT-TelegramBot_TelegramBotServiceAlerte"] = this.translate("VAL_EXT-TelegramBot_TelegramBotServiceAlerte");
      this.VALTranslate["EXT-TelegramBot_favourites"] = this.translate("VAL_EXT-TelegramBot_favourites");
      this.VALTranslate["EXT-TelegramBot_telecast"] = this.translate("VAL_EXT-TelegramBot_telecast");
      this.VALTranslate["EXT-TelegramBot_telecastLife"] = this.translate("VAL_EXT-TelegramBot_telecastLife");
      this.VALTranslate["EXT-TelegramBot_telecastLimit"] = this.translate("VAL_EXT-TelegramBot_telecastLimit");
      this.VALTranslate["EXT-TelegramBot_telecastHideOverflow"] = this.translate("VAL_EXT-TelegramBot_telecastHideOverflow");
      this.VALTranslate["EXT-TelegramBot_telecastContainer"] = this.translate("VAL_EXT-TelegramBot_telecastContainer");
      this.VALTranslate["EXT-TelegramBot_dateFormat"] = this.translate("VAL_EXT-TelegramBot_dateFormat");
      this.VALTranslate["EXT-Updates_AutoUpdate"] = this.translate("VAL_EXT-Updates_AutoUpdate");
      this.VALTranslate["EXT-Updates_AutoRestart"] = this.translate("VAL_EXT-Updates_AutoRestart");
      this.VALTranslate["EXT-Updates_Log"] = this.translate("VAL_EXT-Updates_Log");
      this.VALTranslate["EXT-Updates_Timeout"] = this.translate("VAL_EXT-Updates_Timeout");
      this.VALTranslate["EXT-Updates_Welcome"] = this.translate("VAL_EXT-Updates_Welcome");
      this.VALTranslate["EXT-Updates_Watchdog"] = this.translate("VAL_EXT-Updates_Watchdog");
      this.VALTranslate["EXT-Updates_Bugsounet"] = this.translate("VAL_EXT-Updates_Bugsounet");
      this.VALTranslate["EXT-Volume_Start"] = this.translate("VAL_EXT-Volume_Start");
      this.VALTranslate["EXT-Volume_Sync"] = this.translate("VAL_EXT-Volume_Sync");
      this.VALTranslate["EXT-Website_username"] = this.translate("VAL_EXT-Website_username");
      this.VALTranslate["EXT-Website_password"] = this.translate("VAL_EXT-Website_password");
      this.VALTranslate["EXT-Website_APIDocs"] = this.translate("VAL_EXT-Website_APIDocs");
      this.VALTranslate["EXT-Welcome_Welcome"] = this.translate("VAL_EXT-Welcome_Welcome");
      this.VALTranslate["EXT-YouTube_Fullscreen"] = this.translate("VAL_EXT-YouTube_Fullscreen");
      this.VALTranslate["EXT-YouTube_Width"] = this.translate("VAL_EXT-YouTube_Width");
      this.VALTranslate["EXT-YouTube_Height"] = this.translate("VAL_EXT-YouTube_Height");
      this.VALTranslate["EXT-YouTube_Search"] = this.translate("VAL_EXT-YouTube_Search");
      this.VALTranslate["EXT-YouTube_Display"] = this.translate("VAL_EXT-YouTube_Display");
      this.VALTranslate["EXT-YouTube_Header"] = this.translate("VAL_EXT-YouTube_Header");
      this.VALTranslate["EXT-YouTube_Username"] = this.translate("VAL_EXT-YouTube_Username");
      this.VALTranslate["EXT-YouTube_Password"] = this.translate("VAL_EXT-YouTube_Password");
      this.VALTranslate["EXT-YouTubeCast_Name"] = this.translate("VAL_EXT-YouTubeCast_Name");
      this.VALTranslate["EXT-YouTubeCast_Port"] = this.translate("VAL_EXT-YouTubeCast_Port");
      resolve();
    });
  }

  Get_EXT_TrSchemaValidation () {
    return this.VALTranslate;
  }
}
