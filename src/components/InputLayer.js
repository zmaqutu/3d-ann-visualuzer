import React, {useRef, useState, useEffect, useMemo} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron';



function InputLayer(props) {

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
                <>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'white'} />
                                        ))
                        }
                </>
        )
}

export default InputLayer