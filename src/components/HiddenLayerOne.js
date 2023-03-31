import React, {useRef, useState, useEffect, useMemo, forwardRef} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'


const HiddenLayerOne = forwardRef(function HiddenLayerOne(props, ref) {

       
        const [inputMeshes, setInputMeshes] = useState([])
        useEffect(() => {
                // inputLayer = props.previousLayer.current.children
                // inputLayerPositions = getGlobalPositions()
                
        }, [props])
        
        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -30; row < 30; row+=15) {
                        for(let col = -30; col < 30; col+=15) {
                                positions.push([col, -1, row])
                        }
                }
                return positions
        }, [])

        return (
                <>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'red'} ref={ref} layer={'hiddenLayerOne'}/>
                                ))
                        }
                </>
        )
})

export default HiddenLayerOne