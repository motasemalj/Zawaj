import React from 'react';
import { Image, View, Text, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../theme';
import { getClient } from '../../api/client';

type AvatarProps = {
  uri?: string | null;
  size?: number;
  label?: string;
  style?: ViewStyle;
};

export default function Avatar({ uri, size = 48, label, style }: AvatarProps) {
  const borderRadius = size / 2;
  const baseURL = getClient().defaults.baseURL;
  const fullUri = uri ? `${baseURL}${uri}` : undefined;
  
  // Debug logging (remove after testing)
  if (uri && size > 60) { // Only log for larger avatars (to avoid spam)
    console.log('🖼️ Avatar rendering:', { uri, fullUri: fullUri?.substring(0, 50) + '...', hasUri: !!fullUri });
  }
  
  if (!fullUri) {
    return (
      <View style={[{ width: size, height: size, borderRadius, backgroundColor: '#2b3353', alignItems: 'center', justifyContent: 'center' }, shadows.soft, style]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: size / 3 }}>{label?.slice(0, 1) || '?'}</Text>
      </View>
    );
  }
  return (
    <Image 
      source={{ uri: fullUri }} 
      style={[{ width: size, height: size, borderRadius }, shadows.soft as any, style]}
      onError={(e) => console.log('❌ Avatar image failed to load:', fullUri, e.nativeEvent.error)}
    />
  );
}


