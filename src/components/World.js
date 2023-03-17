import { OrbitControls } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import Grid from './Grid'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'

function World() {
        // states

        // refs
        const cameraPosition = useRef([0,0,375]);
        

        //hooks
        useEffect( () => {
                // generateCubeArray()
        }, [])

        let width = window.innerWidth;
        let height = window.innerHeigh;

        return (
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        {/* <ambientLight intensity = {1} color = {0xBBC2D0}/> */}
                        {/* <hemisphereLight color = {"hsl(0.6, 1, 0.6)"} groundColor = {0x87775d} intensity = {0.1} position = {[0,5,0]} /> */}
                        {/* <directionalLight color = {"hsl(0.1, 1, 0.95)"} groundColor = {0x87775d} intensity = {0.5} position = {[-70,122.5,70]} castShadow = {true}/> */}
                        <Grid />
                        <OrbitControls/> 
                        {/* <cameraHelper args={[camera]} /> */}
                </Canvas>
        )
}

export default World