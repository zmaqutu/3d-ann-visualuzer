import React, {useRef, useState, useEffect, useMemo} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'


function HiddenLayerOne(props) {
        
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
                <>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'red'} />
                                        ))
                        }
                </>
        )
}

export default HiddenLayerOne