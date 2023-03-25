import React, {useRef, useState, useEffect, useMemo} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron'


function OutputLayer(props) {
        //states
        const [outputLayerMeshes, setOutputCubes] = useState([])

        const outputLayerRef = useRef(new THREE.Group());


         // memoize positions for each neuron cube
         const positions = useMemo(() => {
                const positions = []
                for(let row = -75; row <= 75; row+=15) {
                        positions.push([row, -1, 0])
                }
                return positions
        }, [])

        return (
                <group ref={outputLayerRef}  position={[0,0,-350]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log(outputLayerRef)}}>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'green'} />
                                        ))
                        }
                </group>
        )
}

export default OutputLayer