import React, {useRef, useState, useEffect} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'


function OutputLayer(props) {
        //states
        const [outputLayerMeshes, setOutputCubes] = useState([])

        const refs = useRef(outputLayerMeshes.map(() => React.createRef()));


        //hooks
        useEffect( () => {
                generateOutputLayer()
        }, [])

        function generateOutputLayer() {
                const tempCubes = []
                for (let row = -75; row < 75; row+=15) {
                        let position = [row, -1, 0]
                        const currentGeometry = new THREE.BoxGeometry(10,10,10)
                        const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: props.color});

                        const key = row
                        
                        let currentMesh = <>
                                                <primitive attach = 'geometry' object = {currentGeometry} />  
                                                <primitive attach = 'material' object = {currentMaterial} /> 
                                        </>

                        tempCubes.push({currentMesh,position})
                }
                setOutputCubes(tempCubes)

        }

        return (
        <>
                <mesh position = {[0,0,-350]} rotation={[Math.PI /2, 0, 0]}>
                        {
                                outputLayerMeshes.map( (mesh, i) => (
                                        <mesh key = {i} ref = {refs.current[i]} position = {mesh.position}>
                                                {mesh.currentMesh}
                                        </mesh>
                                ))
                        }

                </mesh>
        </>
        )
}

export default OutputLayer