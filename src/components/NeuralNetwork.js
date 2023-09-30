import { Cloud, Line, MapControls, OrbitControls, Points, Sky, Sparkles, Stars } from '@react-three/drei'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import InputLayer from './InputLayer'
import HiddenLayerOne from './HiddenLayerOne'
import HiddenLayerTwo from './HiddenLayerTwo'
import OutputLayer from './OutputLayer'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MnistData } from '../ML Files/mnist_data'
import * as tf from '@tensorflow/tfjs';


export const NeuralNetworkContext = React.createContext()

function NeuralNetwork() {

        // refs
        const cameraPosition = useRef([0,0,575]);
        const inputLayerRef = React.createRef();
        const hiddenLayerOneRef = useRef();
        const hiddenLayerTwoRef = useRef();
        const outputLayerRef = useRef();


        let width = window.innerWidth;
        let height = window.innerHeight;

        const [rotationEnabled, toggleRotation] = useState(true)

        const [inputLayerPositions, setInputPositions] = useState([])
        const [layerOnePositions, setLayerOnePositions] = useState([])
        const [layerTwoPositions, setLayerTwoPositions] = useState([])
        const [outputLayerPositions, setOutputPositions] = useState([])
        const [visualizationState, togglePretrainedVisualization] = useState(false)
        const [animateLines, setAnimateLines] = useState(false)
        const [worker, setWorker] = useState(new Worker(new URL('../workers/worker.js', import.meta.url)))

        const [inputWeightMesh, setInputWeightMesh] = useState(null)
        const [layerOneWeightMesh, setLayerOneWeightMesh] = useState([])
        const [layerTwoWeightMesh, setLayerTwoWeightMesh] = useState([])



        // an array of 20 color InstancedBufferAttributes
        const [colorAttributesArray, setColorAttributesArray] = useState([])


        // useEffect(() => {
        //         // const worker = new Worker('../workers/worker.js')
        //         if(inputLayerPositions.length > 0){
        //                 loadInitialExamples()
        //         }
        // }, [inputLayerPositions])

        // useEffect(() => {
        //         console.log(inputWeightMesh)
        // }, [inputWeightMesh])

        // useEffect(() => {
        //         worker.onmessage = (e) => {
        //                 console.log('Message received from worker', e.data)
        //                 if(e.data.action == 'drawPredictionInput'){
        //                         const imagePixels = e.data.imagePixels
        //                         let tempColorBuffers = []
        //                         const colorScheme = Float32Array.from(imagePixels)

        //                         const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)

        //                         tempColorBuffers.push(currentColorAttribute)

        //                         setColorAttributesArray(tempColorBuffers)
        //                 }
        //                 if(e.data.action == 'animatePrediction'){
        //                         console.log(e.data)
        //                 }
        //         }
        //         const message = {action: 'initializeNetwork'}
        //         worker.postMessage(message)
        //         return () => {
        //                 console.log('terminating worker')
        //                 worker.terminate()
        //         }

        // }, [])


        const loadInitialExamples = useCallback( async () => {
                const data = new MnistData()
                await data.load()
                const examples = data.nextTestBatch(20)
                const numExamples = examples.xs.shape[0];

                let tempColorBuffers = []

                for(let i = 0; i < numExamples; i++){
                        // console.log('iteration', i)
                        const imageTensor = tf.tidy(() => {
                                // Reshape the image to 28x28 px
                                return examples.xs
                                  .slice([i, 0], [1, examples.xs.shape[1]])
                                  .reshape([28, 28, 1]);
                        });

                        const pixels = await tf.browser.toPixels(imageTensor)

                        const colorScheme = Float32Array.from(pixels)

                        const currentColorAttribute = new THREE.InstancedBufferAttribute(colorScheme, 4)
                        tempColorBuffers.push(currentColorAttribute)
                        
                }
                setColorAttributesArray(tempColorBuffers)

        },[])

        function visualizePretrainedModel(){
                // toggleShowCasing(true)
                togglePretrainedVisualization(!visualizationState)
        }
        const updateVisualizationState = useCallback(() => {
                // toggleShowCasing(newState)
                worker.postMessage({action: 'printGlobals'})
                togglePretrainedVisualization(!visualizationState)
        },[])

        function toggleWorldSetup(){

        }

        function trainNetwork(){
                worker.postMessage({action: 'trainNetwork'})
        }

        // this function is called when the user clicks the predict button
        // it randomly selects a test example, draws it on our inputLayer and predicts the number
        function predictInput(){
                // console.log('predicting input')
                worker.postMessage({action: 'predictInput'})
                updateVisualizationState()
                // loadXExamples()
        }

        function toggleLineAnimation(){
                setAnimateLines(!animateLines)
        }

        return (
                <>
                <div>
                        <button onClick={updateVisualizationState} dir={'rtl'}>Visualize Pretrained Model</button>
                        <button onClick={toggleWorldSetup}>Setup Input</button>
                        <button onClick={predictInput}>Randomly Select Test Data and Predict</button>
                        <button onClick={trainNetwork}>Train Network</button>
                        <button onClick={toggleLineAnimation}>Animate Lines</button>



                </div>
                <NeuralNetworkContext.Provider value = {{setInputPositions, setLayerOnePositions, setLayerTwoPositions, setOutputPositions,setInputWeightMesh, setLayerOneWeightMesh, setLayerTwoWeightMesh}}>
                        <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                                <group  position={[0,0,100]} rotation={[Math.PI /2, 0, 0]}  >
                                        <InputLayer ref={inputLayerRef} nextLayerPositions = {layerOnePositions} inputColorAttributes={colorAttributesArray} visualizingModel={visualizationState} animateLines={animateLines} />
                                </group>
                                <group  position={[0,0,-50]} rotation={[Math.PI /2, 0, 0]} >
                                        <HiddenLayerOne nextLayerPositions={layerTwoPositions} ref={inputLayerRef}/>
                                </group>
                                
                                <group ref={hiddenLayerTwoRef} position={[0,0,-150]} rotation={[Math.PI /2, 0, 0]} >
                                        <HiddenLayerTwo nextLayerPositions = {outputLayerPositions} ref={hiddenLayerOneRef}/>
                                </group>
                                <group ref={outputLayerRef}  position={[0,0,-250]} rotation={[Math.PI /2, 0, 0]} >
                                        <OutputLayer ref={hiddenLayerTwoRef}/>
                                </group> 
                                <OrbitControls enableRotate={rotationEnabled}/>
                                {/* <MapControls/> */}
                                <Stars count={100000} depth={400}/>
                                {/* <Cloud /> */}
                                


                                {/* <Sparkles/> */}
                                {/* <Points/> */}
                                {/* <Sky sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} /> */}
                                <axesHelper/>
                                {/* <cameraHelper args={[camera]} /> */}
                        </Canvas>
                </NeuralNetworkContext.Provider>
                </>
        )
}

export default NeuralNetwork