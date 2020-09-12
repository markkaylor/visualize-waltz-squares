const axios = require("axios");
const pitchInfo = require("./pitchInfo.json");

const MidiPlayer = require("midi-player-js");

const audioContext = new AudioContext();

const canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

const size = 200;

const dpr = window.devicePixelRatio;
canvas.height = size * dpr;
canvas.width = size * dpr;
ctx.scale(dpr, dpr);
ctx.translate(size / 2, size / 2);

const canvas2 = document.getElementById("canvas2");
ctx2 = canvas2.getContext("2d");

canvas2.height = size * dpr;
canvas2.width = size * dpr;
ctx2.scale(dpr, dpr);
ctx2.translate(size / 2, size / 2);

ctx.globalCompositeOperation = "color";
ctx2.globalCompositeOperation = "color";

const getMidi = async () => {
  const result = await axios.get(
    "http://localhost:8080/006-b-flat-waltz-piano-v2.mid",
    {
      responseType: "arraybuffer",
    }
  );
  const { data } = result;
  return data;
};

let mp3Data;
const getAudio = async () => {
  const result = await axios.get(
    "http://localhost:8080/006-b-flat-waltz-piano-v2.mp3",
    {
      responseType: "arraybuffer",
    }
  );
  const { data } = result;
  mp3Data = await audioContext.decodeAudioData(data);
  return mp3Data;
};

const playAudio = async () => {
  const audioBuffer = await getAudio();
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};

async function visualize() {
  const midi = await getMidi();
  const Player = new MidiPlayer.Player();
  Player.loadArrayBuffer(midi);
  await playAudio();
  Player.play();

  Player.on("midiEvent", function (event) {
    let pitch;
    let note;
    let squareSize;
    console.log(event);

    let rgb;
    let alpha;
    let rgba;

    if (event.noteName) {
      pitch = event.noteName.replace(/([0-9]|[-])/g, "");
      note = pitchInfo[pitch];
      squareSize = size - (note.number * size) / 12;
      rgb = note.color.join(", ");
      alpha = event.velocity;
      rgba = `${rgb}, 0.${alpha}`;
      ctx.lineWidth = event.velocity;
      ctx2.lineWidth = event.velocity;
    }

    if (event.track === 3) {
      if (
        event.name === "Note on" ||
        event.name === "Note on" ||
        (event.name === "Controller Change" &&
          event.number === 64 &&
          event.value === 127)
      ) {
        console.log("lh");
        ctx.beginPath();
        ctx.rect(
          0 - squareSize / 2,
          0 - squareSize / 2,
          squareSize,
          squareSize
        );
        ctx.strokeStyle = `rgba(${rgba})`;
        ctx.stroke();
      }
    }

    if (event.track === 2) {
      if (
        event.name === "Note on" ||
        (event.name === "Controller Change" &&
          event.number === 64 &&
          event.value === 127)
      ) {
        console.log("rh");
        ctx2.beginPath();
        ctx2.rect(
          0 - squareSize / 2,
          0 - squareSize / 2,
          squareSize,
          squareSize
        );
        ctx2.strokeStyle = `rgba(${rgba})`;
        ctx2.stroke();
      }
    }
  });
}

visualize();
