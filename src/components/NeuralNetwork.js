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


        // an array of 20 color InstancedBufferAttributes
        const [colorAttributesArray, setColorAttributesArray] = useState([])


        useEffect(() => {
                if(inputLayerPositions.length > 0){
                        loadExamples()
                }
        }, [inputLayerPositions])



        const loadExamples = useCallback( async () => {
                const data = new MnistData()
                await data.load()
                const examples = data.nextTestBatch(20)
                const numExamples = examples.xs.shape[0];

                let tempColorBuffers = []

                for(let i = 0; i < numExamples; i++){
                        console.log('iteration', i)
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
        const setInputLayerPositions = useCallback((positions) => {
                setInputPositions(positions)
        },[])
        const setLOnePositions = useCallback((positions) => {
                setLayerOnePositions(positions)
        },[])
        const setLTwoPositions = useCallback((positions) => {
                setLayerTwoPositions(positions)
        },[])
        const setOutputLayerPositions = useCallback((positions) => {
                setOutputPositions(positions)
        },[])

        const updateVisualizationState = useCallback(() => {
                // toggleShowCasing(newState)
                togglePretrainedVisualization(!visualizationState)
        },[])

        return (
                <>
                <div>
                        <button onClick={updateVisualizationState} dir={'rtl'}>Visualize Pretrained Model</button>
                </div>
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        <group  position={[0,0,100]} rotation={[Math.PI /2, 0, 0]}  >
                                <InputLayer ref={inputLayerRef} nextLayerPositions = {layerOnePositions} passPositionsUp = {setInputLayerPositions} inputColorAttributes={colorAttributesArray} visualizingModel={visualizationState}  />
                        </group>
                        <group  position={[0,0,-50]} rotation={[Math.PI /2, 0, 0]} >
                                <HiddenLayerOne nextLayerPositions={layerTwoPositions} passPositionsUp = {setLOnePositions} ref={inputLayerRef}/>
                        </group>
                        <group ref={hiddenLayerTwoRef} position={[0,0,-150]} rotation={[Math.PI /2, 0, 0]} >
                                <HiddenLayerTwo nextLayerPositions = {outputLayerPositions} passPositionsUp = {setLTwoPositions}ref={hiddenLayerOneRef}/>
                        </group>
                        <group ref={outputLayerRef}  position={[0,0,-250]} rotation={[Math.PI /2, 0, 0]} >
                                <OutputLayer passPositionsUp={setOutputLayerPositions} ref={hiddenLayerTwoRef}/>
                        </group> 
                        <OrbitControls enableRotate={rotationEnabled}/>
                        {/* <MapControls/> */}
                        {/* <Stars count={100000} depth={100}/> */}
                        {/* <Cloud /> */}
                        


                        {/* <Sparkles/> */}
                        {/* <Points/> */}
                        {/* <Sky sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} /> */}
                        <axesHelper/>
                        {/* <cameraHelper args={[camera]} /> */}
                </Canvas>
                </>
        )
}

export default NeuralNetwork