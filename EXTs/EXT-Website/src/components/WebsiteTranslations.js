/**********************
/** WebSite Translations *
/*********************/

/* eslint-disable-next-line */
class WebsiteTranslations {
  constructor (Tools) {
    this.translate = (...args) => Tools.translate(...args);

    this.EXTTranslate = {};
    console.log("[WEBSITE] WebsiteTranslation Ready");
  }

  async init () {
    await this.Load_EXT_Translation();
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
}
