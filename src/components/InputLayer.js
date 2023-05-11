import React, {useRef, useState, useEffect, useMemo} from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Neuron from './Neuron';



function InputLayer(props) {

        const [inputMeshes, setInputMeshes] = useState([])
        const inputLayerGeometry = new THREE.BoxGeometry(10,10,10)
        const inputLayerMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color:0x181c20})
        const inputLayerMesh = new THREE.InstancedMesh(inputLayerGeometry, inputLayerMaterial, 784);
        inputLayerMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -210; row < 210; row+=15) {
                        for(let col = -210; col < 210; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, [])
        for(let i = 0; i < positions.length;i++){
                const matrix = new THREE.Matrix4()
                matrix.setPosition(positions[i])
                inputLayerMesh.setMatrixAt(i,matrix)
        }
        console.log(inputLayerMesh)


        return (
                // <>
                //         {
                //                 positions.map( (position, index) => (
                //                         <Neuron key = {index} position = {position} color = {0x181c20} layer={'inputLayer'}/>
                //                         ))
                //         }
                // </>
                <>
    		<primitive object={inputLayerMesh} />
                </>
        )
}

export default InputLayer