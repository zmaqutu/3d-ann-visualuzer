import React, {useRef, useState, useEffect, useMemo} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron';



function InputLayer(props, ref) {
        
        //states
        const [inputLayerMeshes, setInputCubes] = useState([])

        const refs = useRef([])
        const inputLayerRef = useRef(new THREE.Group())


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

        return (
                <group ref={inputLayerRef} position={[0,0,0]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log('inputLayerRef',inputLayerRef)}}>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'white'} />
                                        ))
                        }
                </group>
        )
}

export default InputLayer