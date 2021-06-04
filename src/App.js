// 0. Install fingerpose npm install fingerpose
// 1. Add Use State
// 2. Import emojis and finger pose import * as fp from "fingerpose";
// 3. Setup hook and emoji object
// 4. Update detect function for gesture handling
// 5. Add emoji display to the screen

///////// NEW STUFF ADDED USE STATE
import React, { useRef, useState, useEffect } from "react";
///////// NEW STUFF ADDED USE STATE

// import logo from './logo.svg';
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import "./App.css";
import { drawHand } from "./utilities";

///////// NEW STUFF IMPORTS
import * as fp from "fingerpose";
import victory from "./victory.png";
import thumbs_up from "./thumbs_up.png";
///////// NEW STUFF IMPORTS

// const thumbsDownGesture = new fp.GestureDescription('thumbs_down');
const fullCurlGesture = new fp.GestureDescription("full_curl");
const halfCurlGesture = new fp.GestureDescription("half_curl");
const noCurlGesture   = new fp.GestureDescription("no_curl");

// all fingers are curled in a fist
for (let finger of [
    fp.Finger.Index,
    fp.Finger.Middle,
    fp.Finger.Ring,
    fp.Finger.Pinky,
    fp.Finger.Thumb,
]) {
    fullCurlGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
    halfCurlGesture.addCurl(finger, fp.FingerCurl.HalfCurl, 1.0);
    noCurlGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0)
}

// thumbsDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
// thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
// thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownLeft, 0.5);
// thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownRight, 0.5);

// do this for all other fingers
// thumbsDownGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
// thumbsDownGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
// thumbsDownGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
// thumbsDownGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

function App() {

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  ///////// NEW STUFF ADDED STATE HOOK
  const [emoji, setEmoji] = useState(null);
  const images = { thumbs_up: thumbs_up, victory: victory };

  ///////// NEW STUFF ADDED STATE HOOK

  const runHandpose = async () => {
    const net = await handpose.load();
    console.log("Handpose model loaded.");
    //  Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 500);
  };

  const detect = async (net) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const hand = await net.estimateHands(video);
      // console.log(hand);

      ///////// NEW STUFF ADDED GESTURE HANDLING

      if (hand.length > 0) {

          const GE = new fp.GestureEstimator([
              fullCurlGesture,
              halfCurlGesture,
              noCurlGesture
          ]);

        const gesture = await GE.estimate(hand[0].landmarks, 4);

          ///////// NEW STUFF ADDED GESTURE HANDLING

          // Draw mesh
          const ctx = canvasRef.current.getContext("2d");

          drawHand(hand, ctx);

        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {

              const confidence = gesture.gestures.map(
                (prediction) => prediction.confidence
              );

              const maxConfidence = confidence.indexOf(
                Math.max.apply(null, confidence)
              );

            console.log(gesture.gestures[maxConfidence].name)

            let ges = gesture.gestures[maxConfidence].name;

            let myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIzN2RmMTk3YjY4ZWM0MDQ5YmExZGNhZmI5NTM1ZWU2MyIsImlhdCI6MTYyMjY0MDEyNSwiZXhwIjoxOTM4MDAwMTI1fQ.63T6DhiEb3zxB6dwThkB_XYKZWRnN96v-HVnBXoGGZw");
            myHeaders.append("Content-Type", "application/json");

            let raw = JSON.stringify({
                "entity_id": "light.local_bedroom_light",
                "brightness" : ges === "no_curl" ? 255 : ges === "half_curl" ? 50 : 0,
            });

            let requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            };

            await fetch("http://192.168.1.17:8123/api/services/light/turn_on", requestOptions)

          // console.log(gesture.gestures[maxConfidence].name);
          setEmoji(gesture.gestures[maxConfidence].name);

          console.log(emoji);

        }

      }

    }
  };

  useEffect(()=>{runHandpose()},[]);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
        {/* NEW STUFF */}
        {emoji !== null ? (
          <img
            src={images[emoji]}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 400,
              bottom: 500,
              right: 0,
              textAlign: "center",
              height: 100,
            }}
          />
        ) : (
          ""
        )}

        {/* NEW STUFF */}
      </header>
    </div>
  );
}

export default App;
