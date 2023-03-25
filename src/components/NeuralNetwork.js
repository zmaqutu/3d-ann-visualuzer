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
                        <InputLayer />
                        <axesHelper/>
                        <HiddenLayerOne dimensions={{width: 4, height: 4}} layerNumber={1} color= "red"/>
                        <HiddenLayerTwo dimensions={{width: 4, height: 4}} layerNumber={2} color = "hotpink"/>
                        <OutputLayer/>
                        <OrbitControls/> 
                        {/* <cameraHelper args={[camera]} /> */}
                </Canvas>
        )
}

export default NeuralNetwork