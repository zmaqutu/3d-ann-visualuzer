import React, {useRef, useState, useEffect, useMemo, forwardRef} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron'


const OutputLayer = forwardRef(function OutputLayer(props, hiddenLayerTwoRef) {
        //states
        // const [outputLayerMeshes, setOutputCubes] = useState([])


         // memoize positions for each neuron cube
         const positions = useMemo(() => {
                const positions = []
                for(let row = -75; row <= 75; row+=15) {
                        positions.push([row, -1, 0])
                }
                return positions
        }, [])

        return (
                <>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'green'} ref={hiddenLayerTwoRef} layer={'outputLayer'} />
                                        ))
                        }
                </>
        )
})

export default OutputLayer