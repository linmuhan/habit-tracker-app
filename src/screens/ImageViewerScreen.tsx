import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

export default function ImageViewerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { uri: initialUri, index: initialIndex = 0, photos = [] } = route.params as { uri: string; index?: number; photos?: string[] };
  
  const [currentUri, setCurrentUri] = React.useState(initialUri);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {photos.length > 0 ? `${currentIndex + 1} / ${photos.length}` : '图片查看'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: currentUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Thumbnail strip if multiple photos */}
      {photos.length > 1 && (
        <View style={styles.thumbnailStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbnail,
                  idx === currentIndex && styles.thumbnailActive,
                ]}
                onPress={() => {
                  setCurrentUri(photo);
                  setCurrentIndex(idx);
                }}
              >
                <Image source={{ uri: photo }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height * 0.7,
  },
  thumbnailStrip: {
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  thumbnail: {
    width: 64,
    height: 64,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
