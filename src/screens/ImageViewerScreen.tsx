import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
  PanResponder,
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
  const translateX = useRef(new Animated.Value(0)).current;

  const goToImage = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < photos.length) {
      setCurrentIndex(newIndex);
      setCurrentUri(photos[newIndex]);
    }
  }, [photos]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = width * 0.25;
        
        if (gestureState.dx > swipeThreshold && currentIndex > 0) {
          // Swipe right - go to previous
          Animated.spring(translateX, {
            toValue: width,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            goToImage(currentIndex - 1);
          });
        } else if (gestureState.dx < -swipeThreshold && currentIndex < photos.length - 1) {
          // Swipe left - go to next
          Animated.spring(translateX, {
            toValue: -width,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            goToImage(currentIndex + 1);
          });
        } else {
          // Reset position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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

      {/* Image with swipe */}
      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.imageWrapper,
            { transform: [{ translateX }] },
          ]}
        >
          <Image
            source={{ uri: currentUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
        
        {/* Navigation arrows for multiple photos */}
        {photos.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navArrow, styles.navArrowLeft]}
                onPress={() => goToImage(currentIndex - 1)}
              >
                <Text style={styles.navArrowText}>‹</Text>
              </TouchableOpacity>
            )}
            {currentIndex < photos.length - 1 && (
              <TouchableOpacity
                style={[styles.navArrow, styles.navArrowRight]}
                onPress={() => goToImage(currentIndex + 1)}
              >
                <Text style={styles.navArrowText}>›</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {/* Swipe hint */}
        {photos.length > 1 && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>左右滑动切换图片</Text>
          </View>
        )}
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
                onPress={() => goToImage(idx)}
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
    position: 'relative',
  },
  imageWrapper: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowLeft: {
    left: 16,
  },
  navArrowRight: {
    right: 16,
  },
  navArrowText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '300',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
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
