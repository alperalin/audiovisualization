// Imports
import { hslToRgb } from './utils.js';

// Variables
const WIDTH = 1000;
const HEIGHT = 1000;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let analyzer;
let bufferLength;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const errorHandler = (err) => {
	console.log('You need to give microphone permission', err);
};

// Draws time data to canvas
const drawTimeData = (timeData) => {
	// inject the time data into our timeData array
	analyzer.getByteTimeDomainData(timeData);

	// turn data into something visual
	// 1. clean the canvas
	ctx.clearRect(0, 0, WIDTH, HEIGHT);

	// 2. setup canvas drawing
	ctx.lineWidth = 10;
	ctx.strokeStyle = 'yellow';
	ctx.beginPath();

	// We will show the data as slices on canvas. So, we need to calculate a slice width.
	const sliceWidth = WIDTH / bufferLength;

	// Start position of the slices.
	let x = 0;

	// Draw each time data to canvas
	timeData.forEach((data, i) => {
		const v = data / 128;
		const y = (v * HEIGHT) / 2;

		// draw the lines
		if (i === 0) {
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
		}

		x += sliceWidth;
	});

	ctx.stroke();

	// call itself as soon as possible
	requestAnimationFrame(() => drawTimeData(timeData));
};

// Draws frequency data to canvas
const drawFrequency = (frequencyData) => {
	analyzer.getByteFrequencyData(frequencyData);

	// 1. calculate bar width
	// Multiple 2.5 to get lower end
	const barWidth = (WIDTH / bufferLength) * 2.5;

	// Start position of the slices.
	let x = 0;

	// Draw each frequency data to canvas
	frequencyData.forEach((data) => {
		// data comes between 0 to 255. So, calculate the height of bar.
		const percent = data / 255;
		const barHeight = (HEIGHT * percent) / 2;

		// TODO: Convert color to hsl
		const [h, s, l] = [360 / (percent * 360) - 0.5, 0.4, 0.5];
		const [r, g, b] = hslToRgb(h, s, l);

		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

		x += barWidth + 2;
	});

	// call itself as soon as possible
	requestAnimationFrame(() => drawFrequency(frequencyData));
};

// Gets audio data from the browser api
const getAudio = async () => {
	const stream = await navigator.mediaDevices
		.getUserMedia({
			audio: true,
		})
		.catch(errorHandler);
	const audioCtx = new AudioContext();
	analyzer = audioCtx.createAnalyser();
	const source = audioCtx.createMediaStreamSource(stream);
	source.connect(analyzer);

	// How much data should we collect
	analyzer.fftSize = 2 ** 10;

	// how many pieces of data are there?
	bufferLength = analyzer.frequencyBinCount;

	// pull the data off the audio
	const timeData = new Uint8Array(bufferLength);
	const frequencyData = new Uint8Array(bufferLength);

	// call drawTimeData
	drawTimeData(timeData);

	// call frequencyData
	drawFrequency(frequencyData);
};

getAudio();
