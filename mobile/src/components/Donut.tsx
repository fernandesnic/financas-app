import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Fatia = { valor: number; cor: string };

type Props = {
  fatias: Fatia[];
  tamanho?: number;
  espessura?: number;
  children?: React.ReactNode; // texto no centro
};

export function Donut({ fatias, tamanho = 150, espessura = 22, children }: Props) {
  const raio = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * raio;
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  let acumulado = 0;

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho}>
        {fatias.map((f, i) => {
          const tam = (f.valor / total) * circ;
          const offset = -acumulado;
          acumulado += tam;
          return (
            <Circle
              key={i}
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              stroke={f.cor}
              strokeWidth={espessura}
              fill="none"
              strokeDasharray={`${tam} ${circ - tam}`}
              strokeDashoffset={offset}
              rotation={-90}
              origin={`${tamanho / 2}, ${tamanho / 2}`}
            />
          );
        })}
      </Svg>
      <View
        style={{
          position: 'absolute',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}
