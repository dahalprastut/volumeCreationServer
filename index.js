// server.js
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000; // You can change the port if needed

app.use(express.json());

app.use(cors());

// Route to generate volumetric data
app.post("/generate-volumetric-data", (req, res) => {
	const {
		curveWidth,
		dataSize,
		highestLoopValue,
		middleLoopValue,
		lowestLoopValue,
		lowestIntensityValueInHighestLoop,
		loopStandardDeviation,
		intensityStandardDeviation,
		fileName,
	} = req.body;

	// Your volumetric data generation logic here
	// Note: For simplicity, I'll keep the function you provided as is

	const volumeData = generateVolumetricData(
		curveWidth,
		dataSize,
		highestLoopValue,
		middleLoopValue,
		lowestLoopValue,
		lowestIntensityValueInHighestLoop,
		loopStandardDeviation,
		intensityStandardDeviation,
		fileName
	);

	// Assuming you want to send the volumetric data back as a response
	res.status(200).json({ message: "file written successfully" });
	// res.status(200).send({ volumeData });
});

// Route to handle file download
app.get("/download/:filename", (req, res) => {
	const filename = req.params.filename;
	const fileExtension = filename.split(".").pop(); // Extract the file extension

	let contentType;
	if (fileExtension === "txt") {
		contentType = "text/plain";
	} else if (fileExtension === "byte") {
		contentType = "application/octet-stream";
	} else {
		// Handle unsupported file types
		res.status(400).send("Unsupported file type");
		return;
	}

	const filePath = `${__dirname}/${filename}`; // Path to the file

	// Set headers for file download
	res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
	res.setHeader("Content-Type", contentType);

	// Send the file as response
	res.sendFile(filePath);
});

// Function to generate volumetric data (same as your original function)
function generateVolumetricData(
	UiCurveWidth,
	UiDataSize,
	UiHighestLoopValue,
	UiMiddleLoopValue,
	UiLowestLoopValue,
	UiLowestIntensityValueInHighestLoop,
	UiLoopStandardDeviation,
	UiIntensityStandardDeviation,
	fileName
) {
	// Your existing volumetric data generation logic here

	// record start time
	const startTime = performance.now();

	// Read the JSON file
	const jsonData = fs.readFileSync("./field_lines4.json", "utf-8");

	// Parse the JSON data
	const threeDimArr = JSON.parse(jsonData);
	const highestValue = UiHighestLoopValue || 350;
	const middleValue = UiMiddleLoopValue || 140;
	const lowestValue = UiLowestLoopValue || 90;
	const lowerIntensityValue = UiLowestIntensityValueInHighestLoop || 100;

	const num_field = threeDimArr[4];

	const height = UiDataSize || 512;
	const width = UiDataSize || 512;
	const depth = UiDataSize || 512;
	const curveWidth = UiCurveWidth || 22;

	const filteredNums = num_field.filter((num) => num !== 0);

	// Find the highest, lowest (excluding 0), and middle values
	// This is done to set a limit to what might be the highest, lowest and middle values
	// const highest = filteredNums.sort((a, b) => a - b)[filteredNums.length - 28];
	const highest = filteredNums.sort((a, b) => a - b)[filteredNums.length - 1];

	// const lowest = Math.min(...filteredNums);
	const lowest = filteredNums.sort((a, b) => a - b)[0];
	// const middle = filteredNums.sort((a, b) => a - b)[Math.floor(filteredNums.length / 2) - 10];
	const middle = filteredNums.sort((a, b) => a - b)[Math.floor(filteredNums.length) - 2];

	const volumetricDataset = new Array(width)
		.fill(0)
		.map(() => new Array(height).fill(0).map(() => new Array(depth).fill(0)));

	let count = 0;
	let j = 0;
	let initial_max = num_field[j];

	// for counting
	const obj = {
		highest: 0,
		middle: 0,
		lowest: 0,
	};

	let scaledThicknessArr = [];

	// Function to find the width of each point
	const findingGaussianArray = (max) => {
		scaledThicknessArr = [];
		const start = -2;
		const end = 2;
		const mean = 0;
		const totalNumberOfPoints = max;
		const thicknessArr = [];
		const standardDeviation = UiLoopStandardDeviation || 0.8;

		let xval = start;

		const step = (end - start) / totalNumberOfPoints;

		for (let i = 0; i <= totalNumberOfPoints; i++) {
			const thicknessValue =
				(1 / (standardDeviation * Math.sqrt(2 * Math.PI))) *
				Math.exp(-((xval - mean) ** 2) / (2 * standardDeviation ** 2));
			thicknessArr.push(thicknessValue);
			xval += step;
		}
		const maxThickness = Math.max(...thicknessArr);

		// Scale the thickness values based on the maximum thickness
		const scalingFactor = curveWidth / maxThickness;

		scaledThicknessArr = thicknessArr.map((value) => Math.ceil(value * scalingFactor));
		return scaledThicknessArr;
	};

	let scaledIntensityArr = [];
	// Function to get the intensity of each point
	const getTheGaussianIntenstity = (width, highestIntensity, lowestIntensity) => {
		scaledIntensityArr = [];
		const start = -2;
		const end = 2;
		const mean = 0;
		const totalNumberOfPoints = width * 2;
		const intensityArr = [];
		const standardDeviation = UiIntensityStandardDeviation || 1;

		let xval = start;

		const step = (end - start) / totalNumberOfPoints;

		for (let i = 0; i <= totalNumberOfPoints; i++) {
			const thicknessValue =
				(1 / (standardDeviation * Math.sqrt(2 * Math.PI))) *
				Math.exp(-((xval - mean) ** 2) / (2 * standardDeviation ** 2));
			intensityArr.push(thicknessValue);
			xval += step;
		}

		const maxIntensity = Math.max(...intensityArr);

		// Find the minimum intensity value
		const minIntensity = Math.min(...intensityArr);

		// Calculate the scaling factor to map intensity values from 0 to 128 (for half the range)
		const scalingFactor = (highestIntensity - lowestIntensity) / (maxIntensity - minIntensity);

		// Scale the intensity values based on the maximum intensity
		for (let value of intensityArr) {
			// Scale each value linearly to the range [127, 255]
			const scaledValue = lowestIntensity + (value - minIntensity) * scalingFactor; // Adjusted scaling
			scaledIntensityArr.push(Math.round(scaledValue)); // Round to nearest integer
		}

		let obj = {};
		obj[`${width}`] = scaledIntensityArr;
		memoizedResult.push(obj);
		// console.log("sca", scaledIntensityArr);
	};

	// Function to set the value for a given voxel and its neighbors
	let memoizedResult = [];

	const setVoxelAndNeighbors = (x, y, z, count, highestIntensity, lowestIntensity) => {
		const result = scaledThicknessArr[count]; //Stores the width of each point
		if (memoizedResult.find((el) => el[result]) === undefined) {
			// Here I have calculated the intensity based on the number of points
			// Since the width is for looped in all 3 dimentions, the width is increased which still follows the gaussian pattern
			// So for calculating the intensity I have also multiplied the number of points by 2 inside the function
			// This is done as we can only see one plane in the screen which is 2D at one time and since the width has been incremented in all 3 directions
			// We can only see in 2 plane at one time in 2D. Hence, *2.
			getTheGaussianIntenstity(result, highestIntensity, lowestIntensity);
		}
		const getCorrectWidthArray = memoizedResult.find((el) => el[result])[result];
		for (let i = -result; i <= result; i++) {
			for (let j = -result; j <= result; j++) {
				for (let k = -result; k <= result; k++) {
					const newX = x + i;
					const newY = y + j;
					const newZ = z + k;

					// Check if the new coordinates are within the dimensions of volumetricDataset
					//Do this only if the result changes or store the result using length as it is like a parabola
					if (
						newX >= 0 &&
						newX < width &&
						newY >= 0 &&
						newY < height &&
						newZ >= 0 &&
						newZ < depth &&
						// Check for this case more as it might impact gaussian curve.
						volumetricDataset[newX][newY][newZ] !== highestIntensity // when newX,newY and newZ are created, it might effect previous data
					) {
						// do The gaussian calculation again or see from the memoized data
						const getMaxOfVoxels = Math.max(Math.abs(i), Math.abs(j), Math.abs(k));
						// When getMaxOfVoxels is 0, it means that the line is the central line which should have highest intensity
						// The concept is for x width, I will have 2*x + 1 number of points in 2D ( which is shown in the screen)
						// The middle points are for highest intensity and the edges are for lower intensity (following Gaussian)
						// So we have taken max of i, j and k which means the furthest it is in all dimention
						// if [2,3,5] is the i,j,k then we know that we are talking about a value which is 5 points away in z direction which will have mid value + 5 intensity as a whole.

						const calculateIndex = getMaxOfVoxels == 0 ? result : result + getMaxOfVoxels;
						const getValue = getCorrectWidthArray[calculateIndex];
						// console.log("ge", result, getCorrectWidthArray);
						// console.log("volumetricDataset[newX][newY][newZ]", volumetricDataset[newX][newY][newZ]);

						volumetricDataset[newX][newY][newZ] = getValue;
					}
				}
			}
		}
	};

	findingGaussianArray(num_field[j]);

	for (let i = 0; i < threeDimArr[0].length; i++) {
		const x = Math.round(threeDimArr[0][i]);
		const y = Math.round(threeDimArr[2][i]);
		const z = Math.round(threeDimArr[1][i]);

		// Calculate the absolute differences to know where the curve falls closer which can be used to set the voxel value
		let diffToHighest = Math.abs(initial_max - highest);
		let diffToMidd = Math.abs(initial_max - middle);
		let diffToLowest = Math.abs(initial_max - lowest);

		if (count === initial_max) {
			// console.log("diff", initial_max, highest, middle, lowest);
			if (diffToHighest < diffToMidd && diffToHighest < diffToLowest) {
				obj.highest = obj.highest + 1;
			} else if (diffToMidd < diffToHighest && diffToMidd < diffToLowest) {
				obj.middle = obj.middle + 1;
			} else {
				obj.lowest = obj.lowest + 1;
			}
			j = j + 1;
			initial_max = num_field[j];
			count = 0;
			findingGaussianArray(num_field[j]);
		}

		if (diffToHighest < diffToMidd && diffToHighest < diffToLowest) {
			// Value is closer to highest
			valueToSet = highestValue;
		} else if (diffToMidd < diffToHighest && diffToMidd < diffToLowest) {
			// Value is closer to middle
			valueToSet = middleValue;
		} else {
			// Value is closer to lowest
			valueToSet = lowestValue;
		}
		// Check if the coordinates are within the dimensions of volumetricDataset
		if (x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < depth) {
			if (valueToSet === highestValue) {
				// To have the highest value of bigger width
				// This might be changed if every values must have the same width
				setVoxelAndNeighbors(x, y, z, count, valueToSet, lowerIntensityValue); // Change this argument for dynamism
			} else {
				volumetricDataset[x][y][z] = valueToSet;
			}
		}
		count = count + 1;
	}
	console.log("onj", obj);

	const flattenAndWriteToFile = (data, filename, append = false) => {
		const flattenedData = data.flat(2);
		// const numberOf255Values = flattenedData.filter((value) => value == 255).length;
		// console.log("nu", numberOf255Values);
		// total = total + numberOf255Values;
		const uint8Array = new Uint8Array(flattenedData);
		const flag = append ? "a" : "w";
		fs.writeFileSync(`${filename}.byte`, Buffer.from(uint8Array), { flag }); // 'a' flag appends to the file
		console.log(`Data ${append ? "appended" : "created"} to file "${filename}.byte" successfully.`);
		if (append) {
			const endTime = performance.now();
			const timeInSeconds = (endTime - startTime) / 1000;
			console.log("time taken = ", timeInSeconds);
			let descriptionText = `Time Taken: ${timeInSeconds}\n`;
			for (const [key, value] of Object.entries(description)) {
				descriptionText += `${key}: ${value}\n`;
			}
			fs.writeFileSync(`${filename}.txt`, descriptionText);
			// fs.writeFileSync(`${filename}.txt`, Buffer.from(uint8Array), { flag });
			// console.log("ta", total);
		}
	};
	const currentDate = new Date();
	const formattedDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}/${currentDate.getFullYear()}`;

	const description = {
		"file Name": `${fileName}.byte`,
		"Curve Width": UiCurveWidth,
		"Created Date": formattedDate,
		"Data Size": UiDataSize,
		"Highest Loop Value": UiHighestLoopValue,
		"Middle Loop Value": UiMiddleLoopValue,
		"Lowest Loop Value": UiLowestLoopValue,
		"Lowest Intensity Value": UiLowestIntensityValueInHighestLoop,
		"Loop Standard Deviation": UiLoopStandardDeviation,
		"Intensity Standard Deviation": UiIntensityStandardDeviation,
		"Number of Highest Loop": obj.highest,
		"Mumber of Middle Loop": obj.middle,
		"Number of Lowest Loop": obj.lowest,
		// Add more properties as needed
	};
	// Assuming half of the volumetricDataset
	const firstHalf = volumetricDataset.slice(0, Math.ceil(volumetricDataset.length / 2));
	// Flatten and write the first half
	flattenAndWriteToFile(firstHalf, fileName);

	// Assuming the remaining volumetricDataset
	const secondHalf = volumetricDataset.slice(Math.ceil(volumetricDataset.length / 2));

	// Flatten and append the second half
	flattenAndWriteToFile(secondHalf, fileName, true);

	return volumetricDataset;
}

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
