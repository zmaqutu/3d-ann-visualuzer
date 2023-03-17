import React, {useRef, useState, useEffect} from 'react'
// import { useThree } from 'react-three-fiber'
import { useThree } from '@react-three/fiber'
import HiddenLayer from './HiddenLayer';
import * as THREE from 'three'



function Grid(props) {
        
        //states
        // const [primitives, setPrimitives] = useState(props.primitives)
        const [inputLayerMeshes, setInputCubes] = useState([])



        // useRefs
        const refs = useRef(inputLayerMeshes.map(() => React.createRef()));


        //hooks
        useEffect( () => {
                generateInputLayer()
        }, [])

        
        function generateInputLayer() {
                const tempCubes = []
                for (let row = -145; row <= 145; row+=15) {
                        for (let col = -145; col <= 145; col+=15) {
                                let position = [col, -1, row]
                                const currentGeometry = new THREE.BoxGeometry(10,10,10)
                                const currentMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 'black'});

                                const key = row * 30 + col;
                                
                                let currentMesh = <>
                                                        <primitive attach = 'geometry' object = {currentGeometry} />  
                                                        <primitive attach = 'material' object = {currentMaterial} /> 
                                                </>

                                tempCubes.push({currentMesh,position})
                        }
                }
                setInputCubes(tempCubes)
        }
  return (
        <>
                <mesh position = {[0,0,0]} rotation={[Math.PI /2, 0, 0]}>
                        {/* <gridHelper args = {[300, 30, 0x5c78bd, 0x5c78bd] }/> */}
                        {
                                inputLayerMeshes.map( (mesh, i) => (
                                        <mesh key = {i} ref = {refs.current[i]} position = {mesh.position}>
                                                {mesh.currentMesh}
                                        </mesh>
                                ))
                        }
      
                </mesh>
                <axesHelper />
                {console.log(refs)}
                <HiddenLayer dimensions={{width: 4, height: 4}} layerNumber={1} color="black"/>
                <HiddenLayer dimensions={{width: 4, height: 4}} layerNumber={2} color = "hotpink"/>
                
        </>
  )
}

export default Grid