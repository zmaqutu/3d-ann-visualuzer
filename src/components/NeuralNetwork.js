import { Cloud, Line, MapControls, OrbitControls, Points, Sky, Sparkles, Stars } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import InputLayer from './InputLayer'
import HiddenLayerOne from './HiddenLayerOne'
import HiddenLayerTwo from './HiddenLayerTwo'
import OutputLayer from './OutputLayer'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
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
        let mouseIsDown = false
        
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        const [rotationEnabled, toggleRotation] = useState(true)
        const [colors, setColors] = useState([])

        let showcaseNumbers = {}

        useEffect(() => {
                // inputLayer = props.previousLayer.current.children
                // inputLayerPositions = getGlobalPositions()
                // loadExamples()
                // renderLoop()
                console.log('',hiddenLayerOneRef)
                
        }, [])


        async function loadExamples(){
                // toggleRotation(!rotationEnabled)
                const data = new MnistData()
                await data.load()
                const examples = data.nextTestBatch(20)
                const numExamples = examples.xs.shape[0];
                console.log('examples',numExamples)

                for(let i = 0; i < numExamples; i++){
                        const imageTensor = tf.tidy(() => {
                                // Reshape the image to 28x28 px
                                return examples.xs
                                  .slice([i, 0], [1, examples.xs.shape[1]])
                                  .reshape([28, 28, 1]);
                              });

                        const pixels = await tf.browser.toPixels(imageTensor)
                        // console.log(pixels)
                        let tempColors = []
                        for(let j = 0; j <pixels.length; j+=4){
                                const r = pixels[j] / 255
                                const g = pixels[j+1] / 255
                                const b = pixels[j+2] / 255
                                const alpha = pixels[j+3] / 255
                                const color = new THREE.Color(r,g,b,alpha)
                                tempColors.push(color)

                        }
                        // setColors(tempColors)
                        showcaseNumbers[i]= tempColors
                        // console.log(colors)
                        // console.log(inputLayerRef)
                        // console.log(inputLayerRef.current)

                        // inputLayerRef.current.children.forEach( (child, index) => {
                                        
                        //         child.material.color = colors[index]
                        //         child.material.needsUpdate = true
                        //         // prevChild = child

                        // })

                }
                // console.log(showcaseNumbers)

                return
                const inputLayer = inputLayerRef.current.children;
                const hiddenLayerOne = hiddenLayerOneRef.current.children;

                console.log('inputLayer', inputLayer, 'hiddenLayerOne', hiddenLayerOne)
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
        const randomColors = [0x000000, 0xfcba03,]

        let prevChild = null

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
                // if(mouseIsDown){
                //         return
                // }

        }
        function mouseDownHandler(event){
                // console.log(event)
                return
                event.stopPropagation()
                // inputLayerRef.current.traverse( (child) => {
                        // if(child.isMesh){
                        //         child.material.color = new THREE.Color(0x000000)
                        //         child.material.needsUpdate = true
                        // }
                        if (event.intersects.length > 0) {
                                const mesh = event.intersects[0].object;
                                // mesh.material.color.set(0xff0000); // Set the color of the intersected child mesh to red
                                // mesh.material.needsUpdate = true;
                                mesh.material.color = new THREE.Color(0x000000)
                                mesh.material.needsUpdate = true
                        }
                // })
                // console.log('mouseDownHandler',e)
        }

        function showColors(){
                for(let i in showcaseNumbers){
                        // console.log('i',i)
                        setTimeout(() => {
                                inputLayerRef.current.children.forEach( (child, index) => {
                                        console.log('drawing')
                                        child.material.color = showcaseNumbers[i][index]
                                        child.material.needsUpdate = true
                                })
                        }, 5000);

                }
                

                

        }

        //machine Learning code
        const LEARNING_RATE = 0.1

        return (
                <>
                <div>
                        {/* <button onClick={drawExamples} dir={'rtl'}>Load data</button> */}
                        <button onClick={showColors} dir={'rtl'}>Show numbers</button>

                </div>
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        <group ref={inputLayerRef} position={[0,0,100]} rotation={[Math.PI /2, 0, 0]}  >
                                <InputLayer />
                        </group>
                        <group ref={hiddenLayerOneRef} position={[0,0,-50]} rotation={[Math.PI /2, 0, 0]} >
                                <HiddenLayerOne  ref={inputLayerRef}/>
                        </group>
                        <group ref={hiddenLayerTwoRef} position={[0,0,-150]} rotation={[Math.PI /2, 0, 0]} >
                                <HiddenLayerTwo ref={hiddenLayerOneRef}/>
                        </group>
                        <group ref={outputLayerRef}  position={[0,0,-250]} rotation={[Math.PI /2, 0, 0]} >
                                <OutputLayer ref={hiddenLayerTwoRef}/>
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