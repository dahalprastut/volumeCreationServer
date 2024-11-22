// server.js
const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000; // You can change the port if needed

app.use(express.json());

app.use(cors());

// Route to generate volumetric data
app.post("/generate-volumetric-data", (req, res) => {
  const {
    alphaValue,
    curveWidth,
    curveWidthMiddle,
    curveWidthLowest,
    dataSize,
    loopsNumber,
    highestLoopValue,
    middleLoopValue,
    lowestLoopValue,
    lowestIntensityValueInHighestLoop,
    lowestIntensityValueInMiddleLoop,
    lowestIntensityValueInLowestLoop,
    loopStandardDeviation,
    middleLoopStandardDeviation,
    lowestLoopStandardDeviation,
    intensityStandardDeviation,
    middleIntensityStandardDeviation,
    lowestIntensityStandardDeviation,
    highestLoopPercentage,
    middleLoopPercentage,
    lowestLoopPercentage,
    fileName,
  } = req.body;

  // Your volumetric data generation logic here
  //

  const volumeData = generateVolumetricData(
    alphaValue,
    curveWidth,
    curveWidthMiddle,
    curveWidthLowest,
    dataSize,
    loopsNumber,
    highestLoopValue,
    middleLoopValue,
    lowestLoopValue,
    lowestIntensityValueInHighestLoop,
    lowestIntensityValueInMiddleLoop,
    lowestIntensityValueInLowestLoop,
    loopStandardDeviation,
    middleLoopStandardDeviation,
    lowestLoopStandardDeviation,
    intensityStandardDeviation,
    middleIntensityStandardDeviation,
    lowestIntensityStandardDeviation,
    highestLoopPercentage,
    middleLoopPercentage,
    lowestLoopPercentage,
    fileName
  );

  // Assuming you want to send the volumetric data back as a response
  res.status(200).json({ message: "file written successfully" });
  // res.status(200).send({ volumeData });
});

// Route to handle file download
app.get(
  "/download/:alphaValue/:highestLoopPercentage/:middleLoopPercentage/:lowestLoopPercentage/:loopsNumber/:filename",
  (req, res) => {
    const filename = req.params.filename;
    let nameWithoutExtension = filename.split(".").slice(0, -1).join(".");
    const folderName = `Mag_Field_00_[${req.params.alphaValue}]_${req.params.loopsNumber}`;
    console.log("here", nameWithoutExtension);
    const subFolderName = `${req.params.highestLoopPercentage}_${req.params.middleLoopPercentage}_${req.params.lowestLoopPercentage}_${nameWithoutExtension}`;
    console.log("subFolderName", subFolderName);
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

    const filePath = `${__dirname}/${folderName}/${subFolderName}/${filename}`; // Path to the file

    // Set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", contentType);

    // Send the file as response
    res.sendFile(filePath);
  }
);

// Function to generate volumetric data (same as original function)
function generateVolumetricData(
  UiAlphaValue,
  UiCurveWidth,
  UiCurveWidthMiddle,
  UiCurveWidthLowest,
  UiDataSize,
  UILoopsNumber,
  UiHighestLoopValue,
  UiMiddleLoopValue,
  UiLowestLoopValue,
  UiLowestIntensityValueInHighestLoop,
  UiLowestIntensityValueInMiddleLoop,
  UiLowestIntensityValueInLowestLoop,
  UiLoopStandardDeviation,
  UiMiddleLoopStandardDeviation,
  UiLowestLoopStandardDeviation,
  UiIntensityStandardDeviation,
  UiMiddleIntensityStandardDeviation,
  UiLowestIntensityStandardDeviation,
  UIHighestLoopPercentage,
  UIMiddleLoopPercentage,
  UILowestLoopPercentage,
  fileName
) {
  const loopCount = UILoopsNumber;
  // Your existing volumetric data generation logic here
  const alphaValue = UiAlphaValue || 0.0;

  const folderName = `Mag_Field_00_[${alphaValue}]_${loopCount}`;
  const subFolderName = `${UIHighestLoopPercentage}_${UIMiddleLoopPercentage}_${UILowestLoopPercentage}_${fileName}`;
  const fileLoc = `./${folderName}/field3.json`;

  // record start time
  const startTime = performance.now();

  // Read the JSON file
  const jsonData = fs.readFileSync(fileLoc, "utf-8");

  // Parse the JSON data
  const threeDimArr = JSON.parse(jsonData);
  const highestValue = UiHighestLoopValue || 350;
  const middleValue = UiMiddleLoopValue || 140;
  const lowestValue = UiLowestLoopValue || 90;
  const highestLoopLowerIntensityValue =
    UiLowestIntensityValueInHighestLoop || 100;
  const middleLoopLowerIntensityValue =
    UiLowestIntensityValueInMiddleLoop || 80;
  const lowestLoopLowerIntensityValue =
    UiLowestIntensityValueInLowestLoop || 80;

  const num_field = threeDimArr[3]; //This is changed in alpha json file. In dopole it was [4]

  const height = UiDataSize || 512;
  const width = UiDataSize || 512;
  const depth = UiDataSize || 512;
  const curveWidth = UiCurveWidth || 12;
  const curveWidthMiddle = UiCurveWidthMiddle || 5;
  const curveWidthLowest = UiCurveWidthLowest || 3;

  const highestLoopStandardDeviation = UiLoopStandardDeviation || 0.8;
  const middleLoopStandardDeviation = UiMiddleLoopStandardDeviation || 0.8;
  const lowestLoopStandardDeviation = UiLowestLoopStandardDeviation || 0.8;

  const highestIntensityStandardDeviation = UiIntensityStandardDeviation || 1;
  const middleIntensityStandardDeviation =
    UiMiddleIntensityStandardDeviation || 1;
  const lowestIntensityStandardDeviation =
    UiLowestIntensityStandardDeviation || 1;

  // Dynamic percentage values (can be changed as needed)
  const highestPercentage = UIHighestLoopPercentage || 50; // percentage for highest
  const middlePercentage = UIMiddleLoopPercentage || 30; // percentage for middle
  const lowestPercentage = UILowestLoopPercentage || 20; // percentage for lowest

  console.log("values", {
    alphaValue,
    curveWidth,
    curveWidthMiddle,
    curveWidthLowest,
    highestValue,
    middleValue,
    lowestValue,
    highestLoopLowerIntensityValue,
    middleLoopLowerIntensityValue,
    lowestLoopLowerIntensityValue,
    highestLoopStandardDeviation,
    middleLoopStandardDeviation,
    lowestLoopStandardDeviation,
    highestIntensityStandardDeviation,
    middleIntensityStandardDeviation,
    lowestIntensityStandardDeviation,
    highestPercentage,
    middlePercentage,
    lowestPercentage,
  });

  const filteredNums = num_field.filter((num) => num !== 0);
  filteredNums.sort((a, b) => a - b);

  // Calculate number of items in each category
  const highestCount = Math.floor(
    (highestPercentage / 100) * filteredNums.length
  );
  const middleCount = Math.floor(
    (middlePercentage / 100) * filteredNums.length
  );
  const lowestCount = filteredNums.length - highestCount - middleCount; // Remainder goes to lowest

  // Index boundaries for each category
  const highestStartIdx = filteredNums.length - highestCount; // Highest category starts from here
  const middleStartIdx = lowestCount; // Middle category starts from here
  const lowestEndIdx = middleStartIdx - 1; // Lowest category ends here

  // Values for highest, middle, and lowest
  const highest = filteredNums.slice(highestStartIdx); // Highest values
  const middle = filteredNums.slice(middleStartIdx, highestStartIdx); // Middle values
  const lowest = filteredNums.slice(0, lowestEndIdx + 1); // Lowest values

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
  const findingGaussianArray = (max, dynamicCurveWidth, SD) => {
    scaledThicknessArr = [];
    const start = -2;
    const end = 2;
    const mean = 0;
    const totalNumberOfPoints = max;
    const thicknessArr = [];
    const standardDeviation = SD;

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
    const minThickness = Math.min(...thicknessArr);
    // Scale the thickness values based on the maximum thickness
    const scalingFactor =
      (dynamicCurveWidth - 1) / (maxThickness - minThickness);
    for (let value of thicknessArr) {
      const scaledValue = 1 + (value - minThickness) * scalingFactor;
      scaledThicknessArr.push(Math.round(scaledValue));
    }

    return scaledThicknessArr;
  };

  let scaledIntensityArr = [];
  // Function to get the intensity of each point
  const getTheGaussianIntenstity = (
    width,
    highestIntensity,
    lowestIntensity,
    SD
  ) => {
    scaledIntensityArr = [];
    const start = -2;
    const end = 2;
    const mean = 0;
    const totalNumberOfPoints = width * 2;
    const intensityArr = [];
    const standardDeviation = SD;

    let xval = start;

    const step = (end - start) / totalNumberOfPoints;

    for (let i = 0; i <= totalNumberOfPoints; i++) {
      const thicknessValue =
        (1.0 / (standardDeviation * Math.sqrt(2.0 * Math.PI))) *
        Math.exp(-((xval - mean) ** 2) / (2.0 * standardDeviation ** 2));
      intensityArr.push(thicknessValue);
      xval += step;
    }

    const maxIntensity = Math.max(...intensityArr);

    // Find the minimum intensity value
    const minIntensity = Math.min(...intensityArr);

    // Calculate the scaling factor to map intensity values from 0 to 128 (for half the range)
    const scalingFactor =
      (highestIntensity - lowestIntensity) / (maxIntensity - minIntensity);

    // Scale the intensity values based on the maximum intensity
    for (let value of intensityArr) {
      // Scale each value linearly to the range [127, 255]
      const scaledValue =
        lowestIntensity + (value - minIntensity) * scalingFactor; // Adjusted scaling
      scaledIntensityArr.push(Math.round(scaledValue)); // Round to nearest integer
    }

    let obj = {};
    obj[`${width}`] = scaledIntensityArr;
    memoizedResult.push(obj);
    // console.log("sca", scaledIntensityArr);
  };

  // Function to set the value for a given voxel and its neighbors
  let memoizedResult = [];

  let diffToHighest = Math.abs(initial_max - highest);
  let diffToMidd = Math.abs(initial_max - middle);
  let diffToLowest = Math.abs(initial_max - lowest);

  if (diffToHighest < diffToMidd && diffToHighest < diffToLowest) {
    findingGaussianArray(
      num_field[j],
      curveWidth,
      highestLoopStandardDeviation
    );
  } else if (diffToMidd < diffToHighest && diffToMidd < diffToLowest) {
    findingGaussianArray(
      num_field[j],
      curveWidthMiddle,
      middleLoopStandardDeviation
    );
  } else {
    findingGaussianArray(
      num_field[j],
      curveWidthLowest,
      lowestLoopStandardDeviation
    );
  }

  // findingGaussianArray(num_field[j], curveWidth); // Is this needed? because we already did that in the first lop whicle chekcking count

  const setVoxelAndNeighbors = (
    x,
    y,
    z,
    count,
    highestIntensity,
    lowestIntensity,
    SD
  ) => {
    const result = scaledThicknessArr[count]; //Stores the width of each point
    // console.log("max", scaledThicknessArr.indexOf(21));
    if (memoizedResult.find((el) => el[result]) === undefined) {
      // Here I have calculated the intensity based on the number of points
      // Since the width is for loop in all 3 dimensions, the width is increased which still follows the gaussian pattern
      // So for calculating the intensity I have also multiplied the number of points by 2 inside the function
      // This is done as we can only see one plane in the screen which is 2D at one time and since the width has been incremented in all 3 directions
      // We can only see in 2 plane at one time in 2D. Hence, *2.
      getTheGaussianIntenstity(result, highestIntensity, lowestIntensity, SD);
    }
    // console.log("memoi", memoizedResult);
    const getCorrectWidthArray = memoizedResult.find((el) => el[result])[
      result
    ];
    const radius = result;
    // Need to fixed intensity gauusian shape as the circumferance is set and the width is changed.
    for (let i = -result; i <= result; i++) {
      for (let j = -result; j <= result; j++) {
        for (let k = -result; k <= result; k++) {
          const distance = Math.sqrt(i ** 2 + j ** 2 + k ** 2);
          if (distance <= radius) {
            const newX = x + i;
            const newY = y + j;
            const newZ = z + k;
            // Check if the new coordinates are within the dimensions of volumetricDataset

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
              const calculateIndex = result + Math.round(distance);
              const getValue = getCorrectWidthArray[calculateIndex];
              volumetricDataset[newX][newY][newZ] = getValue;
            }
          }
        }
      }
    }
  };

  for (let i = 0; i < threeDimArr[0].length; i++) {
    const x = Math.round(threeDimArr[0][i]);
    const y = Math.round(threeDimArr[2][i]);
    const z = Math.round(threeDimArr[1][i]);

    // Calculate the absolute differences to know where the curve falls closer which can be used to set the voxel value
    // diffToHighest = Math.abs(initial_max - highest);
    // diffToMidd = Math.abs(initial_max - middle);
    // diffToLowest = Math.abs(initial_max - lowest);

    if (count === initial_max) {
      count = 0;

      // if (diffToHighest < diffToMidd && diffToHighest < diffToLowest) {
      //   obj.highest = obj.highest + 1;
      // } else if (diffToMidd < diffToHighest && diffToMidd < diffToLowest) {
      //   obj.middle = obj.middle + 1;
      // } else {
      //   obj.lowest = obj.lowest + 1;
      // }
      j = j + 1;

      initial_max = num_field[j];

      // Calculate the absolute differences to know where the curve falls closer which can be used to set the voxel value
      // diffToHighest = Math.abs(initial_max - highest);
      // diffToMidd = Math.abs(initial_max - middle);
      // diffToLowest = Math.abs(initial_max - lowest);

      if (highest.includes(initial_max)) {
        findingGaussianArray(
          num_field[j],
          curveWidth,
          highestLoopStandardDeviation
        );
        obj.highest = obj.highest + 1;
      } else if (middle.includes(initial_max)) {
        // console.log("here", num_field[j]);
        findingGaussianArray(
          num_field[j],
          curveWidthMiddle,
          middleLoopStandardDeviation
        );
        obj.middle = obj.middle + 1;
      } else {
        findingGaussianArray(
          num_field[j],
          curveWidthLowest,
          lowestLoopStandardDeviation
        );
        obj.lowest = obj.lowest + 1;
      }

      // findingGaussianArray(num_field[j]);
    }
    if (x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < depth) {
      if (highest.includes(initial_max)) {
        setVoxelAndNeighbors(
          x,
          y,
          z,
          count,
          highestValue,
          highestLoopLowerIntensityValue,
          highestIntensityStandardDeviation
        );
      } else if (middle.includes(initial_max)) {
        // Value is closer to middle
        setVoxelAndNeighbors(
          x,
          y,
          z,
          count,
          middleValue,
          middleLoopLowerIntensityValue,
          middleIntensityStandardDeviation
        );
      } else {
        // Value is closer to lowest
        setVoxelAndNeighbors(
          x,
          y,
          z,
          count,
          lowestValue,
          lowestLoopLowerIntensityValue,
          lowestIntensityStandardDeviation
        );
      }
    }
    count = count + 1;
  }
  console.log("onj", obj);
  const flattenAndWriteToFile = (data, filename, append = false) => {
    // Ensure subfolder exists
    const folderPath = path.join(folderName, subFolderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Folder "${folderPath}" created successfully.`);
    }

    fs.writeFileSync(`scaled.txt`, scaledThicknessArr.join(", "));

    const flattenedData = data.flat(2);
    const uint8Array = new Uint8Array(flattenedData);
    const flag = append ? "a" : "w";

    fs.writeFileSync(
      path.join(folderPath, `${filename}.byte`),
      Buffer.from(uint8Array),
      { flag }
    ); // 'a' flag appends to the file

    console.log(
      `Data ${
        append ? "appended" : "created"
      } to file "${filename}.byte" successfully.`
    );

    if (append) {
      const endTime = performance.now();
      const timeInSeconds = (endTime - startTime) / 1000;
      console.log("Time taken =", timeInSeconds);

      let descriptionText = `Time Taken: ${timeInSeconds}\n`;
      for (const [key, value] of Object.entries(description)) {
        descriptionText += `${key}: ${value}\n`;
      }

      fs.writeFileSync(
        path.join(folderPath, `${filename}.txt`),
        descriptionText
      );
    }
  };
  const currentDate = new Date();
  const formattedDate = `${
    currentDate.getMonth() + 1
  }/${currentDate.getDate()}/${currentDate.getFullYear()}`;

  const description = {
    "file Name": `${fileName}.byte`,
    alphaValue,
    curveWidth,
    curveWidthMiddle,
    curveWidthLowest,
    highestValue,
    middleValue,
    lowestValue,
    highestLoopLowerIntensityValue,
    middleLoopLowerIntensityValue,
    lowestLoopLowerIntensityValue,
    highestLoopStandardDeviation,
    middleLoopStandardDeviation,
    lowestLoopStandardDeviation,
    highestIntensityStandardDeviation,
    middleIntensityStandardDeviation,
    lowestIntensityStandardDeviation,
    highestPercentage,
    middlePercentage,
    lowestPercentage,
    loopsNumber: loopCount,
    // Add more properties as needed
  };
  // Assuming half of the volumetricDataset
  const firstHalf = volumetricDataset.slice(
    0,
    Math.ceil(volumetricDataset.length / 2)
  );
  // Flatten and write the first half
  flattenAndWriteToFile(firstHalf, fileName);

  // Assuming the remaining volumetricDataset
  const secondHalf = volumetricDataset.slice(
    Math.ceil(volumetricDataset.length / 2)
  );

  // Flatten and append the second half
  flattenAndWriteToFile(secondHalf, fileName, true);

  // Function to copy .byte file to CUDA folder, run make, and execute
  const triggerCuda = (
    cudaFolderPath,
    byteFilePath,
    byteFileName,
    screenshotFolderPath
  ) => {
    // Step 1: Copy .byte file to CUDA folder
    const cudaByteFilePath = path.join(
      `${cudaFolderPath}/data`,
      byteFileName + ".byte"
    );
    fs.copyFileSync(byteFilePath, cudaByteFilePath);
    console.log(`Copied ${byteFileName}.byte to CUDA folder.`);

    // Step 2: Replace the volumeFilename in the CUDA .cpp file
    const cudaSourcePath = path.join(cudaFolderPath, "volumeRender.cpp");
    let sourceCode = fs.readFileSync(cudaSourcePath, "utf8");

    // Replace the current volumeFilename with the new one
    const newSourceCode = sourceCode.replace(
      /const char \*volumeFilename = "(.*)";/,
      `const char *volumeFilename = "${byteFileName}.byte";`
    );

    // Write the updated source code back to the .cpp file
    fs.writeFileSync(cudaSourcePath, newSourceCode, "utf8");
    console.log(
      `Updated volumeFilename in CUDA source to ${byteFileName}.byte.`
    );

    // Step 3: Run 'make' inside CUDA folder
    exec("make", { cwd: cudaFolderPath }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error during make: ${stderr}`);
        return;
      }
      console.log(`Make executed successfully: ${stdout}`);
      // Step 4: Run the CUDA program with the screenshot path argument
      const screenshotPathArg = `--screenshot_path=${screenshotFolderPath}`;
      exec(
        `./volumeRender ${screenshotPathArg}`,
        { cwd: cudaFolderPath },
        (err, stdout, stderr) => {
          if (err) {
            console.error(`Error during CUDA execution: ${stderr}`);
            return;
          }
          console.log(`CUDA program output: ${stdout}`);
          console.log(`Screenshot should be saved in ${screenshotFolderPath}`);
        }
      );
    });
  };

  const cudaPath = `/home/dahalp/prastut/cuda-samples/Samples/5_Domain_Specific/volumeRender/`;
  const dataPath = `./${folderName}/${subFolderName}/${fileName}.byte`;
  const screenshotFolderPath = `/home/dahalp/prastut/volumeCreationServer/${folderName}/${subFolderName}`;
  triggerCuda(cudaPath, dataPath, fileName, screenshotFolderPath);

  return volumetricDataset;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
