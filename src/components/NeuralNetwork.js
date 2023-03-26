import { OrbitControls } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import InputLayer from './InputLayer'
import HiddenLayerOne from './HiddenLayerOne'
import HiddenLayerTwo from './HiddenLayerTwo'
import OutputLayer from './OutputLayer'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'

function NeuralNetwork() {

        // refs
        const cameraPosition = useRef([0,0,375]);
        const inputLayerRef = useRef();
        const hiddenLayerOneRef = useRef();
        const hiddenLayerTwoRef = useRef();
        const outputLayerRef = useRef();


        let width = window.innerWidth;
        let height = window.innerHeigh;

        return (
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        <group ref={inputLayerRef} position={[0,0,0]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log('inputLayerRef',typeof inputLayerRef)}}>
                                <InputLayer />
                        </group>
                        <group ref={hiddenLayerOneRef} position={[0,0,-150]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log('1ref',hiddenLayerOneRef)}}>
                                <HiddenLayerOne dimensions={{width: 4, height: 4}} layerNumber={1} color= "red"/>
                        </group>
                        <group ref={hiddenLayerTwoRef} position={[0,0,-250]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log('ref2', hiddenLayerTwoRef)}}>
                                <HiddenLayerTwo dimensions={{width: 4, height: 4}} layerNumber={2} color = "hotpink"/>
                        </group>
                        <group ref={outputLayerRef}  position={[0,0,-350]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log(outputLayerRef)}}>
                                <OutputLayer/>
                        </group>
                        <OrbitControls/>
                        <axesHelper/>
                        {/* <cameraHelper args={[camera]} /> */}
                </Canvas>
        )
}

export default NeuralNetwork