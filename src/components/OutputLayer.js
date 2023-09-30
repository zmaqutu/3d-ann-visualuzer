import React, {useRef, useState, useEffect, useMemo, forwardRef, useContext} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron'
import { NeuralNetworkContext } from './NeuralNetwork';



const OutputLayer = forwardRef(function OutputLayer(props, hiddenLayerTwoRef) {
        
        //states and variables
        const outputLayerGeometry = new THREE.BoxGeometry(10,10,10)
        const outputLayerMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color:'green'})
        const outputLayerMesh = new THREE.InstancedMesh(outputLayerGeometry, outputLayerMaterial, 784);
        outputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        const [
                setInputPositions, 
                setLayerOnePositions, 
                setLayerTwoPositions, 
                setOutputPositions, 
                inputLayerPositions
        ]  = useContext(NeuralNetworkContext)

         // memoize positions for each neuron cube
         const positions = useMemo(() => {
                const positions = []
                for(let row = -75; row <= 75; row+=15) {
                        positions.push(new THREE.Vector3(row, -1, 0))

                }
                setOutputPositions(positions)
                return positions
        }, [])

        for(let i = 0; i < positions.length;i++){
                const matrix = new THREE.Matrix4()
                matrix.setPosition(positions[i])
                outputLayerMesh.setMatrixAt(i,matrix)
        }

        return (
                <>
    		        <primitive object={outputLayerMesh} />
                </>
        )
})

export default OutputLayer