/* global addAnimateCSS, removeAnimateCSS */

/* eslint-disable-next-line */
class VolumeDisplayer {
  constructor (text) {
    this.volumeText = text;

    this.timerOutSpeaker = null;
    this.timerOutSpeakerHide = null;

    this.timerOutRecorder = null;
    this.timerOutRecorderHide = null;

    this.timerOutMuted = null;
    this.timerOutMutedHide = null;
    console.log("[VOLUME] VolumeDisplayer Ready");
  }

  prepare () {
    var volumeContainer = document.createElement("div");
    volumeContainer.id = "EXT_VOLUME-SPEAKER";
    volumeContainer.classList.add("hidden");
    var volumeIconContainer = document.createElement("div");
    volumeIconContainer.id = "EXT_VOLUME-SPEAKER_CONTAINER_ICON";
    var volumeIcon = document.createElement("div");
    volumeIcon.id = "EXT_VOLUME-SPEAKER_ICON";
    volumeIcon.className = "mdi mdi-volume-high";
    volumeIconContainer.appendChild(volumeIcon);
    volumeContainer.appendChild(volumeIconContainer);
    var volumeText = document.createElement("div");
    volumeText.id = "EXT_VOLUME-SPEAKER_TEXT";
    volumeContainer.appendChild(volumeText);
    var volumeBar = document.createElement("div");
    volumeBar.id = "EXT_VOLUME-SPEAKER_BAR";
    volumeContainer.appendChild(volumeBar);
    document.body.appendChild(volumeContainer);

    var recorderContainer = document.createElement("div");
    recorderContainer.id = "EXT_VOLUME-RECORDER";
    recorderContainer.classList.add("hidden");
    var recorderIconContainer = document.createElement("div");
    recorderIconContainer.id = "EXT_VOLUME-RECODER_CONTAINER_ICON";
    var recorderIcon = document.createElement("div");
    recorderIcon.id = "EXT_VOLUME-RECORDER_ICON";
    recorderIcon.className = "mdi mdi-microphone";
    recorderIconContainer.appendChild(recorderIcon);
    recorderContainer.appendChild(recorderIconContainer);
    var recorderText = document.createElement("div");
    recorderText.id = "EXT_VOLUME-RECORDER_TEXT";
    recorderContainer.appendChild(recorderText);
    var recorderBar = document.createElement("div");
    recorderBar.id = "EXT_VOLUME-RECORDER_BAR";
    recorderContainer.appendChild(recorderBar);
    document.body.appendChild(recorderContainer);

    var muteContainer = document.createElement("div");
    muteContainer.id = "EXT_VOLUME-MUTE";
    muteContainer.classList.add("hidden");
    var muteIconContainer = document.createElement("div");
    muteIconContainer.id = "EXT_VOLUME-MUTE_CONTAINER_ICON";
    var muteIcon = document.createElement("img");
    muteIcon.id = "EXT_VOLUME-MUTE_ICON";
    muteIcon.src = "/modules/MMM-Bugsounet/EXTs/EXT-Volume/resources/mute.png";
    muteIconContainer.appendChild(muteIcon);
    muteContainer.appendChild(muteIconContainer);
    document.body.appendChild(muteContainer);
  }

  drawVolumeSpeaker (current) {
    clearTimeout(this.timerOutSpeaker);
    clearTimeout(this.timerOutSpeakerHide);
    var volume = document.getElementById("EXT_VOLUME-SPEAKER");
    volume.classList.remove("hidden");
    removeAnimateCSS("EXT_VOLUME-SPEAKER", "zoomOut");
    addAnimateCSS("EXT_VOLUME-SPEAKER", "zoomIn", 1);

    var volumeText = document.getElementById("EXT_VOLUME-SPEAKER_TEXT");
    volumeText.innerHTML = `${this.volumeText} ${current}%`;
    var volumeBar = document.getElementById("EXT_VOLUME-SPEAKER_BAR");
    volumeBar.style.width = `${current}%`;
    this.timerOutSpeaker = setTimeout(() => {
      removeAnimateCSS("EXT_VOLUME-SPEAKER", "zoomIn");
      addAnimateCSS("EXT_VOLUME-SPEAKER", "zoomOut", 1);
      this.timerOutSpeakerHide = setTimeout(() => {
        volume.classList.add("hidden");
        removeAnimateCSS("EXT_VOLUME-SPEAKER", "zoomOut");
      }, 1000);
    }, 3000);
  }

  drawVolumeRecorder (current) {
    clearTimeout(this.timerOutRecorder);
    clearTimeout(this.timerOutRecorderHide);
    var recorder = document.getElementById("EXT_VOLUME-RECORDER");
    recorder.classList.remove("hidden");
    removeAnimateCSS("EXT_VOLUME-RECORDER", "zoomOut");
    addAnimateCSS("EXT_VOLUME-RECORDER", "zoomIn", 1);
    var recorderText = document.getElementById("EXT_VOLUME-RECORDER_TEXT");
    recorderText.innerHTML = `${this.volumeText} ${current}%`;
    var recorderBar = document.getElementById("EXT_VOLUME-RECORDER_BAR");
    recorderBar.style.width = `${current}%`;
    this.timerOutRecorder = setTimeout(() => {
      removeAnimateCSS("EXT_VOLUME-RECORDER", "zoomIn");
      addAnimateCSS("EXT_VOLUME-RECORDER", "zoomOut", 1);
      this.timerOutRecorderHide = setTimeout(() => {
        recorder.classList.add("hidden");
        removeAnimateCSS("EXT_VOLUME-RECORDER", "zoomOut");
      }, 1000);
    }, 3000);
  }

  drawVolumeMuted () {
    clearTimeout(this.timerOutMuted);
    clearTimeout(this.timerOutMutedHide);
    var mute = document.getElementById("EXT_VOLUME-MUTE");
    mute.classList.remove("hidden");
    removeAnimateCSS("EXT_VOLUME-MUTE", "zoomOut");
    addAnimateCSS("EXT_VOLUME-MUTE", "zoomIn", 1);
    this.timerOutMuted = setTimeout(() => {
      removeAnimateCSS("EXT_VOLUME-MUTE", "zoomIn");
      addAnimateCSS("EXT_VOLUME-MUTE", "zoomOut", 1);
      this.timerOutMutedHide = setTimeout(() => {
        mute.classList.add("hidden");
        removeAnimateCSS("EXT_VOLUME-MUTE", "zoomOut");
      }, 1000);
    }, 3000);
  }
}

