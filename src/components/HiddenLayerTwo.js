import React, {useRef, useState, useEffect, useMemo, forwardRef} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'


const HiddenLayerTwo = forwardRef(function HiddenLayerTwo(props, hiddenLayerOneRef) {
        // states
        // const [hiddenLayerMeshes, setHiddenLayer] = useState([])
        // const [layerPosition, setLayerPosition] = useState([])

        const layerTwoGeometry = new THREE.BoxGeometry(10,10,10)
        const layerTwoMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide,color:'hotpink'})
        const layerTwoMesh = new THREE.InstancedMesh(layerTwoGeometry, layerTwoMaterial, 16);
        layerTwoMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // memoize positions for each neuron cube
        const positions = useMemo(() => {
                const positions = []
                for(let row = -30; row < 30; row+=15) {
                        for(let col = -30; col < 30; col+=15) {
                                positions.push(new THREE.Vector3(col, -1, row))
                        }
                }
                return positions
        }, [])

        for(let i = 0; i < positions.length;i++){
                const matrix = new THREE.Matrix4()
                matrix.setPosition(positions[i])
                layerTwoMesh.setMatrixAt(i,matrix)
        }

        return (
                // <>
                //         {
                //                 positions.map( (position, index) => (
                //                         <Neuron key = {index} position = {position} color = {'hotpink'} ref={hiddenLayerOneRef} layer={'hiddenLayerTwo'} />
                //                         ))
                //         }
                // </>
                <>
    		        <primitive object={layerTwoMesh} />
                </>
        )
})

export default HiddenLayerTwo