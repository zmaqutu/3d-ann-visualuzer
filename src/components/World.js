import { OrbitControls } from '@react-three/drei'
import React, { useEffect, useRef, useState } from 'react'
import Grid from './Grid'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'

function World() {
        // states
        const [cubeMeshes, setCubes] = useState([])

        // refs
        const cameraPosition = useRef([0,0,375]);
        

        //hooks
        useEffect( () => {
                generateCubeArray()
        }, [])

        let width = window.innerWidth;
        let height = window.innerHeigh;


        function generateCubeArray() {
                const tempCubes = []
                for (let row = -145; row <= 145; row+=15) {
                        for (let col = -145; col <= 145; col+=15) {
                                let position = [col, -1, row]
                                const currentGeometry = new THREE.BoxGeometry(10,10,10)
                                const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 'black'});

                                const key = row * 30 + col;
                                
                                let currentMesh = <>
                                                        <primitive attach = 'geometry' object = {currentGeometry} />  
                                                        <primitive attach = 'material' object = {currentMaterial} /> 
                                                </>

                                tempCubes.push({currentMesh,position})
                        }
                }
                setCubes(tempCubes)
        }
        return (
                <Canvas camera = {{ position: cameraPosition.current, fov: 53, aspect: width / height, near: 1, far: 5000 }}>
                        {/* <ambientLight intensity = {1} color = {0xBBC2D0}/> */}
                        {/* <hemisphereLight color = {"hsl(0.6, 1, 0.6)"} groundColor = {0x87775d} intensity = {0.1} position = {[0,5,0]} /> */}
                        {/* <directionalLight color = {"hsl(0.1, 1, 0.95)"} groundColor = {0x87775d} intensity = {0.5} position = {[-70,122.5,70]} castShadow = {true}/> */}
                        <Grid primitives = {cubeMeshes}/>
                        <OrbitControls/> 
                        {/* <cameraHelper args={[camera]} /> */}
                </Canvas>
        )
}

export default World