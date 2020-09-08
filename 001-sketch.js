const MidiPlayer = require("midi-player-js");
const axios = require("axios");
const pitchInfo = require("./pitchInfo.json");

const canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

const size = 200;

const dpr = window.devicePixelRatio;
canvas.height = size * dpr;
canvas.width = size * dpr;
ctx.scale(dpr, dpr);
ctx.translate(size / 2, size / 2);

const getMidi = async () => {
  const result = await axios.get("http://localhost:8080/midi-raw.mid", {
    responseType: "arraybuffer",
  });
  const { data } = result;
  return data;
};

async function visualize() {
  const data = await getMidi();
  const Player = new MidiPlayer.Player();
  Player.loadArrayBuffer(data);
  Player.play();

  Player.on("midiEvent", function (event) {
    let pitch;
    let note;
    let squareSize;

    let rgb;
    let alpha;
    let rgba;

    if (event.noteName) {
      pitch = event.noteName.replace(/([0-9]|[-])/g, "");
      note = pitchInfo[pitch];
      squareSize = size - (note.number * size) / 12;
      rgb = note.color;
      alpha = event.velocity;
      rgba = `${rgb.join(", ")}, 0.${alpha}`;
    }

    if (event.name === "Note on") {
      ctx.beginPath();
      ctx.rect(0 - squareSize / 2, 0 - squareSize / 2, squareSize, squareSize);
      ctx.fillStyle = `rgba(${rgba})`;
      ctx.fill();
    }

    if (event.name === "Note off") {
      ctx.clearRect(
        0 - squareSize / 2,
        0 - squareSize / 2,
        squareSize,
        squareSize
      );
    }
  });
}

visualize();
