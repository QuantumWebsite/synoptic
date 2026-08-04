const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const { width: canvasWidth, height: canvasHeight } = canvas.getBoundingClientRect();

canvas.width = canvasWidth;
canvas.height = canvasHeight;

/**
 * Simulated station Line
 **/

// Station line Length
const sLLen = (canvasWidth < canvasHeight ? canvasWidth : canvasHeight) * 0.25;

let COLORING_STYLE = "uniform"; // "speed", "direction", or "uniform"

const AXIS_COLOR = "rgba(122, 162, 210, 0.3)";
const ARROW_COLOR = "#f2a65a";
const ARROW_GLOW = "rgba(242, 166, 90, 0.55)";
const STATION_DOT_COLOR = "#eab767";

// Line Position
const nLP = { x: canvasWidth / 2, y: canvasHeight / 2 - sLLen };
const sLP = { x: canvasWidth / 2, y: canvasHeight / 2 + sLLen };
const wLP = { x: canvasWidth / 2 - sLLen, y: canvasHeight / 2 };
const eLP = { x: canvasWidth / 2 + sLLen, y: canvasHeight / 2 };

// station wind data;
const wind = {
    N: { ...nLP, speed: 100, direction: 0, v: { x: 0, y: 0 } },
    S: { ...sLP, speed: 100, direction: 180, v: { x: 0, y: 0 } },
    W: { ...wLP, speed: 100, direction: 90, v: { x: 0, y: 0 } },
    E: { ...eLP, speed: 100, direction: 270, v: { x: 0, y: 0 } },
};

function calculateVelocity(w) {
    const rad = (w.direction * Math.PI) / 180;

    w.v.x = Math.sin(rad) * w.speed;
    w.v.y = -Math.cos(rad) * w.speed;
}

function getWindVector(x, y) {
    let NW = 1 - y / canvasHeight;
    let SW = y / canvasHeight;
    let WW = 1 - x / canvasWidth;
    let EW = x / canvasWidth;

    const sum = NW + SW + WW + EW;

    NW /= sum;
    SW /= sum;
    WW /= sum;
    EW /= sum;

    const vx = wind.N.v.x * NW + wind.S.v.x * SW + wind.E.v.x * EW + wind.W.v.x * WW;
    const vy = wind.N.v.y * NW + wind.S.v.y * SW + wind.E.v.y * EW + wind.W.v.y * WW;

    return { vx, vy };
}

function arrowHead(x, y, height, degree = 45) {
    const angle = (degree * Math.PI) / 180;
    height = Math.min(height, canvasHeight * 0.18);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y + height);
    ctx.rotate(angle);
    ctx.translate(-x, -(y + height));
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + height - 10);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y + height);
    ctx.rotate(-angle);
    ctx.translate(-x, -(y + height));
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + height - 10);
    ctx.stroke();
    ctx.restore();
}

function drawArrowHead(w) {
    const rad = ((w.direction - 180) * Math.PI) / 180;

    ctx.strokeStyle = ARROW_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.shadowColor = ARROW_GLOW;
    ctx.shadowBlur = 10;

    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(rad);
    ctx.translate(-w.x, -w.y);
    arrowHead(w.x, w.y, w.speed);
    ctx.restore();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.fillStyle = STATION_DOT_COLOR;
    ctx.arc(w.x, w.y, 4, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;

    // Height Line
    ctx.beginPath();
    ctx.moveTo(nLP.x, nLP.y);
    ctx.lineTo(sLP.x, sLP.y);
    ctx.stroke();

    // Width Line
    ctx.beginPath();
    ctx.moveTo(wLP.x, wLP.y);
    ctx.lineTo(eLP.x, eLP.y);
    ctx.stroke();

    Object.values(wind).forEach((w) => {
        calculateVelocity(w);
        drawArrowHead(w);
    });
}

function randomNum(min, max) {
    return Math.random() * (max - min) + min;
}

class Particles {
    constructor({ x, y, vx, vy, r = 1 }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.r = r;
    }

    draw() {
        if (COLORING_STYLE === "speed") {
            const w = getWindVector(this.x, this.y);
            const speed = Math.hypot(w.vx, w.vy);
            ctx.fillStyle = getWindColor(speed);
        } else if (COLORING_STYLE === "direction") {
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            ctx.fillStyle = getWindColor(speed);
        } else {
            ctx.fillStyle = "white";
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        const w = getWindVector(this.x, this.y);

        this.vx += w.vx * dt;
        this.vy += w.vy * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.vx *= 0.98;
        this.vy *= 0.98;

        if (
            this.x < -canvasWidth / 10 ||
            this.x > canvasWidth * 1.1 ||
            this.y < -canvasHeight / 10 ||
            this.y > canvasHeight * 1.1
        ) {
            const x = randomNum(-canvasWidth / 2, canvasWidth * 1.5);
            const y = randomNum(-canvasHeight / 2, canvasHeight * 1.5);

            this.x = x;
            this.y = y;

            this.vx = 0;
            this.vy = 0;
        }
    }
}

const particles = [];

for (let i = 0; i < 500; i++) {
    particles.push(
        new Particles({
            x: randomNum(-canvasWidth / 2, canvasWidth * 1.5),
            y: randomNum(-canvasHeight / 2, canvasHeight * 1.5),
            vx: 0,
            vy: 0,
        })
    );
}

let lastTime = 0;
function animate(t) {
    const deltaTime = Math.min((t - lastTime) / 1000, 1);
    lastTime = t;

    ctx.fillStyle = "rgba(7, 15, 25, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    draw();

    for (const particle of particles) {
        particle.draw();
        particle.update(deltaTime);
    }

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

const WIND_COLORS = [
    { speed: 0, color: [0, 0, 255] },
    { speed: 5, color: [0, 255, 255] },
    { speed: 10, color: [0, 255, 0] },
    { speed: 15, color: [255, 255, 0] },
    { speed: 20, color: [255, 165, 0] },
    { speed: 25, color: [255, 0, 0] },
    { speed: 30, color: [255, 255, 255] },
];

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getWindColor(speed) {
    if (speed <= WIND_COLORS[0].speed) return `rgb(${WIND_COLORS[0].color.join(",")})`;
    if (speed >= WIND_COLORS[WIND_COLORS.length - 1].speed)
        return `rgb(${WIND_COLORS[WIND_COLORS.length - 1].color.join(",")})`;

    for (let i = 0; i < WIND_COLORS.length - 1; i++) {
        const a = WIND_COLORS[i];
        const b = WIND_COLORS[i + 1];

        if (speed >= a.speed && speed <= b.speed) {
            const t = (speed - a.speed) / (b.speed - a.speed);
            const r = Math.round(lerp(a.color[0], b.color[0], t));
            const g = Math.round(lerp(a.color[1], b.color[1], t));
            const bl = Math.round(lerp(a.color[2], b.color[2], t));
            return `rgb(${r}, ${g}, ${bl})`;
        }
    }
}

/**
 * UI wiring — instrument panel
 **/

function pad3(n) {
    return String(Math.round(n)).padStart(3, "0");
}

document.querySelectorAll(".station").forEach((stationEl) => {
    const key = stationEl.dataset.station;
    const dialInput = stationEl.querySelector(".dial__input");
    const dialPointer = stationEl.querySelector(".dial__pointer");
    const dirReadout = stationEl.querySelector(`[data-readout="${key}"]`);
    const speedInput = stationEl.querySelector(".speed__input");
    const speedReadout = stationEl.querySelector(`[data-speed-readout="${key}"]`);

    dialInput.addEventListener("input", (e) => {
        const value = Number(e.target.value);
        wind[key].direction = value;
        calculateVelocity(wind[key]);
        dialPointer.style.setProperty("--angle", `${value}deg`);
        dirReadout.textContent = `${pad3(value)}\u00B0`;
    });

    speedInput.addEventListener("input", (e) => {
        const value = Number(e.target.value);
        wind[key].speed = value;
        calculateVelocity(wind[key]);
        speedReadout.textContent = `${Math.round(value)} kt`;
    });

    // initialize pointer angle from markup defaults
    dialPointer.style.setProperty("--angle", `${dialInput.value}deg`);
});

/**
 * Coloring style segmented control
 **/

const modeSwitch = document.getElementById("mode-switch");
const modeInputs = Array.from(modeSwitch.querySelectorAll('input[name="coloring-style"]'));
const modeThumb = modeSwitch.querySelector(".mode-switch__thumb");
const legend = document.getElementById("legend");

function updateModeThumb() {
    const index = modeInputs.findIndex((input) => input.checked);
    const widthPct = 100 / modeInputs.length;
    modeThumb.style.setProperty("--thumb-w", `${widthPct}%`);
    modeThumb.style.setProperty("--thumb-x", `${index * 100}%`);
}

modeInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
        COLORING_STYLE = e.target.value;
        updateModeThumb();
        legend.hidden = COLORING_STYLE !== "speed";
    });
});

updateModeThumb();
legend.hidden = COLORING_STYLE === "uniform";


const panel = document.querySelector('.panel');
let panelTimeoutId = null;

function keepPanelAlive() {
    // 1. Show the panel
    panel.style.display = 'flex';

    // 2. Reset the timer every time the user interacts
    if (panelTimeoutId) {
        clearTimeout(panelTimeoutId);
    }

    // 3. Start timer: panel will only hide after 3 seconds of COMPLETE INACTIVITY
    panelTimeoutId = setTimeout(() => {
        panel.style.display = 'flex';
    }, 3000);
}

// Listen for mouse movement, clicks, and keyboard activity anywhere on the document
['mousemove', 'click', 'keydown', 'touchstart'].forEach((eventType) => {
    document.addEventListener(eventType, keepPanelAlive);
});
