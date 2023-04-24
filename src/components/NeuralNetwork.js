import { Cloud, Line, MapControls, OrbitControls, Points, Sky, Sparkles, Stars } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import InputLayer from './InputLayer'
import HiddenLayerOne from './HiddenLayerOne'
import HiddenLayerTwo from './HiddenLayerTwo'
import OutputLayer from './OutputLayer'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'

function NeuralNetwork() {

        // refs
        const cameraPosition = useRef([0,0,475]);
        const inputLayerRef = React.createRef();
        const hiddenLayerOneRef = useRef();
        const hiddenLayerTwoRef = useRef();
        const outputLayerRef = useRef();


        let width = window.innerWidth;
        let height = window.innerHeight;

        const [rotationEnabled, toggleRotation] = useState(true)

        // useEffect(() => {
        //         console.log('inputLayerRef', inputLayerRef)
        //         console.log('hiddenLayerOneRef', hiddenLayerOneRef)
        //         console.log('hiddenLayerTwoRef', hiddenLayerTwoRef)
        //         console.log('outputLayerRef', outputLayerRef)
        // // drawConnections()
        // }, [inputLayerRef, hiddenLayerOneRef, hiddenLayerTwoRef, outputLayerRef])

        function drawConnections(){
                console.log('drawConnections')
                console.log(inputLayerRef.current)
                toggleRotation(!rotationEnabled)
                return
                const inputLayer = inputLayerRef.current.children;
                const hiddenLayerOne = hiddenLayerOneRef.current.children;

                console.log('inputLayer', inputLayer, 'hiddenLayerOne', hiddenLayerOne)
        }
        // function renderLoop(){
        //         window.requestAnimationFrame(renderLoop)

        //         // hoverLoop()
        //         visualizeTrainingInstance()
        // }
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

        }


        return (
                <>
                <div>
                        <button onClick={visualizeTrainingInstance}>Enable Rotation</button>
                </div>
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        <group ref={inputLayerRef} position={[0,0,100]} rotation={[Math.PI /2, 0, 0]} >
                                <InputLayer />
                        </group>
                        <group ref={hiddenLayerOneRef} position={[0,0,-50]} rotation={[Math.PI /2, 0, 0]} >
                                {/* <HiddenLayerOne previousLayer={inputLayerRef}/> */}
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