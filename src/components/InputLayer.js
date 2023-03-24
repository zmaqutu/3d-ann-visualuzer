import React, {useRef, useState, useEffect, useMemo} from 'react'
import { useThree } from '@react-three/fiber'
import HiddenLayerOne from './HiddenLayerOne';
import HiddenLayerTwo from './HiddenLayerTwo';
import * as THREE from 'three'
import OutputLayer from './OutputLayer';
import Neuron from './Neuron';



function InputLayer(props) {
        
        //states
        const [inputLayerMeshes, setInputCubes] = useState([])



        // useRefs
        // const refs = useRef(inputLayerMeshes.map(() => React.createRef()));
        const refs = useRef([])


        //hooks
        // useEffect( () => {
        //         generateInputLayer()
        //         refs.current = inputLayerMeshes.map(() => React.createRef())
        // }, [])

        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -145; row <= 145; row+=15) {
                        for(let col = -145; col <= 145; col+=15) {
                                positions.push([col, -1, row])
                        }
                }
                return positions
        }, [])

        
        // function generateInputLayer() {
        //         const tempCubes = []
                
        //         for (let row = -145; row <= 145; row+=15) {
        //                 for (let col = -145; col <= 145; col+=15) {
        //                         let position = [col, -1, row]
        //                         const currentGeometry = new THREE.BoxGeometry(10,10,10)
        //                         const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 'white'});

        //                         const key = row * 30 + col;
                                
        //                         let currentMesh = <>
        //                                                 <primitive attach = 'geometry' object = {currentGeometry} />  
        //                                                 <primitive attach = 'material' object = {currentMaterial} /> 
        //                                         </>

        //                         tempCubes.push({currentMesh,position})
        //                 }
        //         }
        //         setInputCubes(tempCubes)
        // }
        return (
                // <>
                //         <mesh position = {[0,0,0]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log(refs)}}>
                //                 <gridHelper args = {[300, 30, 0xa83244, 0xa83244] }/>
                //                 {
                //                         inputLayerMeshes.map( (mesh, i) => (
                //                                 <mesh key = {i} ref = {refs.current[i]} position = {mesh.position}>
                //                                         {mesh.currentMesh}
                //                                 </mesh>
                //                         ))
                //                 }
        
                //         </mesh>
                //         <axesHelper />
                // </>
                <group position={[0,0,0]} rotation={[Math.PI /2, 0, 0]}>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'white'} />
                                        ))
                        }
                </group>
        )
}

export default InputLayer