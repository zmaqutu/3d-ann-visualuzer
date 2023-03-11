import React, {useRef, useState} from 'react'
// import { useThree } from 'react-three-fiber'

function Grid(props) {
        
        //states
        const [primitives, setPrimitives] = useState(props.primitives)

        // useRefs
        const refs = useRef(primitives.map(() => React.createRef()));

        //hooks
        // const { camera, scene } = useThree();

        // const cubes = []
        // for (let x = 0; x < 30; x++) {
        //         for (let y = 0; y < 30; y++) {
        //         cubes.push(
        //                 <mesh key={`${x}-${y}`} position={[x, y, 0]}>
        //                 <boxBufferGeometry args={[1, 1, 1]} />
        //                 <meshStandardMaterial color="orange" />
        //                 </mesh>
        //         )
        //         }
        // }
  return (
        <>
                <mesh position = {[0,0,0]}>
                        {/* <gridHelper args = {[300, 30, 0x5c78bd, 0x5c78bd] }/> */}
                        {
                                primitives.map( (mesh, i) => (
                                        <mesh key = {i} ref = {refs.current[i]} rotation={[-Math.PI /2, 0, 0]} position = {mesh.position}>
                                                {mesh.currentMesh}
                                        </mesh>
                                ))
                        }
      
                        <axesHelper />
                </mesh>
        </>
  )
}

export default Grid