import React, {useRef, useState, useEffect, useMemo, forwardRef} from 'react'
import * as THREE from 'three'
import Neuron from './Neuron'


const HiddenLayerOne = forwardRef(function HiddenLayerOne(props, inputLayerRef) {

       
        // const [inputMeshes, setInputMeshes] = useState([])
        const layerOneGeometry = new THREE.BoxGeometry(10,10,10)
        const layerOneMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color:'red'})
        const layerOneMesh = new THREE.InstancedMesh(layerOneGeometry, layerOneMaterial, 16);
        layerOneMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        // useEffect(() => {
        //         // inputLayer = props.previousLayer.current.children
        //         // inputLayerPositions = getGlobalPositions()
                
        // }, [props])
        
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
                layerOneMesh.setMatrixAt(i,matrix)
        }

        return (
                // <>
                //         {
                //                 positions.map( (position, index) => (
                //                         <Neuron key = {index} position = {position} color = {'red'} ref={inputLayerRef} layer={'hiddenLayerOne'}/>
                //                 ))
                //         }
                // </>
                <>
    		<primitive object={layerOneMesh} />
                </>
        )
})

export default HiddenLayerOne