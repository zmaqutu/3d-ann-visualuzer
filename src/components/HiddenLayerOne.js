import React, {useRef, useState, useEffect, useMemo} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'


function HiddenLayerOne(props) {
        // states
        const [hiddenLayerMeshes, setHiddenLayer] = useState([])
        const [layerPosition, setLayerPosition] = useState([])

        const hiddenLayerOneRef = useRef(new THREE.Group());

        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -30; row <= 30; row+=15) {
                        for(let col = -30; col <= 30; col+=15) {
                                positions.push([col, -1, row])
                        }
                }
                return positions
        }, [])

        return (
                <group ref={hiddenLayerOneRef} position={[0,0,-150]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log('1ref',hiddenLayerOneRef)}}>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'red'} />
                                        ))
                        }
                </group>
        )
}

export default HiddenLayerOne