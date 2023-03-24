import React, {useRef, useState, useEffect, useMemo} from 'react'
import * as THREE from 'three'
import HiddenLayerTwo from './HiddenLayerTwo'
import Neuron from './Neuron'


function HiddenLayerOne(props) {
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

        // useRefs
        // const refs = useRef(hiddenLayerMeshes.map(() => React.createRef()));

        //hooks
        // useEffect( () => {
        //         generateHiddenLayer()
        //         if(props.layerNumber === 1){
        //                 setLayerPosition([0,0,-150])
        //         }
        //         else if(props.layerNumber === 2){
        //                 setLayerPosition([0,0,-250])
        //         }
        // }, [])

        // function generateHiddenLayer(){
        //         const tempCubes = []
        //         for (let row = -30; row < 30; row+=15) {
        //                 for (let col = -30; col < 30; col+=15) {
        //                         let position = [col, -1, row]
        //                         const currentGeometry = new THREE.BoxGeometry(10,10,10)
        //                         const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: props.color});

        //                         const key = row * 4 + col;
                                
        //                         let currentMesh = <>
        //                                                 <primitive attach = 'geometry' object = {currentGeometry} />  
        //                                                 <primitive attach = 'material' object = {currentMaterial} /> 
        //                                         </>

        //                         tempCubes.push({currentMesh,position})
        //                 }
        //         }
        //         setHiddenLayer(tempCubes)
        // }

        return (
                // <>
                //         <mesh position = {layerPosition} rotation={[Math.PI /2, 0, 0]}>
                //                 {/* <gridHelper args = {[300, 30, 0x5c78bd, 0x5c78bd] }/> */}
                //                 {
                //                         hiddenLayerMeshes.map( (mesh, i) => (
                //                                 <mesh key = {i} ref = {refs.current[i]} position = {mesh.position}>
                //                                         {mesh.currentMesh}
                //                                 </mesh>
                //                         ))
                //                 }

                //         </mesh>

                // </>
                <group position={[0,0,-150]} rotation={[Math.PI /2, 0, 0]} onClick={ e => {console.log(positions)}}>
                        {
                                positions.map( (position, index) => (
                                        <Neuron key = {index} position = {position} color = {'red'} />
                                        ))
                        }
                </group>
        )
}

export default HiddenLayerOne