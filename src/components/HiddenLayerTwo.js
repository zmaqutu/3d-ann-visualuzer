import React, {useRef, useState, useEffect, useMemo} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'


function HiddenLayerTwo(props) {
        // states
        const [hiddenLayerMeshes, setHiddenLayer] = useState([])
        const [layerPosition, setLayerPosition] = useState([])

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
                <group position={[0,0,-250]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log(positions)}}>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'hotpink'} />
                                        ))
                        }
                </group>
        )
}

export default HiddenLayerTwo