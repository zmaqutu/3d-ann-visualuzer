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
        const [colors, setColors] = useState([])

        const [inputLayerPositions, setInputPositions] = useState([])
        const [layerOnePositions, setLayerOnePositions] = useState([])
        const [layerTwoPositions, setLayerTwoPositions] = useState([])
        const [outputLayerPositions, setOutputPositions] = useState([])


        let colorBuffers = []
        const randomColors = [0x000000, 0xfcba03,]

        let prevChild = null


        //machine Learning variables
        const LEARNING_RATE = 0.1

        useEffect(() => {
                // loadExamples()
                console.log('inputLayerPos useffect',inputLayerPositions)

        }, [inputLayerPositions])


        async function loadExamples(){
                // toggleRotation(!rotationEnabled)
                console.log('loading examples')
                return
                const data = new MnistData()
                await data.load()
                const examples = data.nextTestBatch(1)
                const numExamples = examples.xs.shape[0];

                for(let i = 0; i < numExamples; i++){
                        console.log('iteration', i)
                        const imageTensor = tf.tidy(() => {
                                // Reshape the image to 28x28 px
                                return examples.xs
                                  .slice([i, 0], [1, examples.xs.shape[1]])
                                  .reshape([28, 28, 1]);
                        });

                        const pixels = await tf.browser.toPixels(imageTensor)
                        // console.log('imageTensor',imageTensor.dataSync())
                        // const dataArr = imageTensor.dataSync()
                        console.log('pixels',pixels)
                        
                }

        }
        function renderLoop(){
                window.requestAnimationFrame(renderLoop)

                // hoverLoop()
                if(inputLayerRef.current != null){
                        // visualizeTrainingInstance()
                        showColors()

                }
                // showColors()
        }
        

        function visualizeTrainingInstance(){
                // for(let i = 0; i < inputLayerRef.current.chi)
                inputLayerRef.current.children.forEach( (child, index) => {
                        setTimeout(() => {
                                if(prevChild){
                                        prevChild.material.color = new THREE.Color(0xffffff); // change the previous child back to white
                                        prevChild.material.needsUpdate = true;
                                }
                                child.material.color = new THREE.Color(0xfcba03)
                                child.material.needsUpdate = true
                                prevChild = child
                        }, index * 100);

                })

        }

        function showColors(){
                console.log(inputLayerPositions)
                // for(let i in showcaseNumbers){
                //         // console.log('i',i)
                //         setTimeout(() => {
                //                 inputLayerRef.current.children.forEach( (child, index) => {
                //                         console.log('drawing')
                //                         child.material.color = showcaseNumbers[i][index]
                //                         child.material.needsUpdate = true
                //                 })
                //         }, 5000);

                // }
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

        const planeGeo = new THREE.PlaneGeometry( 500, 500);
        const planeMat = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( planeGeo, planeMat );


        return (
                <>
                <div>
                        {/* <button onClick={drawExamples} dir={'rtl'}>Load data</button> */}
                        <button onClick={showColors} dir={'rtl'}>Show numbers</button>

                </div>
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        <group  position={[0,0,100]} rotation={[Math.PI /2, 0, 0]}  >
                                <InputLayer ref={inputLayerRef} nextLayerPositions = {layerOnePositions} passPositionsUp = {setInputLayerPositions}/>
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
                        {/* <group position={[0,0,100]}  >
                                <primitive object={plane}/>

                        </group>  */}
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

// const kat = {
//         name: 'Kat',
//         age: 25,
//         location: 'New York',
//         getName: function(){
//                 return this.name
//         }
// }
// console.log(kat.getName())