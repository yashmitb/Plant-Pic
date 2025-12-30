import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// Kindwise API used!
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef(null);
  const [uri, setUri] = useState(null);
  const [data, setData] = useState(null);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (!ref.current) return;
    setData(null);
    const photo = await ref.current.takePictureAsync();
    const base64 = await FileSystem.readAsStringAsync(photo.uri, {
      encoding: 'base64',
    });

    setUri(photo.uri);
    getInfoFromAPI(base64);
  };

  const getInfoFromAPI = async (imgBase64Url) => {
    const requestData = {
      api_key: 'mgW5WRzMWEGbJPe3cCreUiTeK8inIlpe0x3wjGx0LgB6IxuiB5',
      images: [imgBase64Url],
      modifiers: ['crops_fast', 'similar_images'],
      plant_language: 'en',
      plant_details: [
        'common_names',
        'url',
        'wiki_description',
        'taxonomy',
        'synonyms',
      ],
    };

    try {
      const res = await axios.post(
        'https://api.plant.id/v2/identify',
        requestData
      );
      setData(res.data);
    } catch (error) {
      console.error('Error fetching plant data:', error);
    }
  };

  const renderPicture = () => {
    return (
      <ScrollView contentContainerStyle={styles.infoContainer}>
        <Image source={{ uri }} contentFit="cover" style={styles.image} />
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => setUri(null)}
          activeOpacity={0.7} // Adds a subtle press effect
        >
          <Text style={styles.retakeButtonText}>📸 Take Another Picture</Text>
        </TouchableOpacity>

        {data && data.suggestions ? (
  data.suggestions.map((item, index) => {
    const probability = Math.ceil((item.probability || 0) * 100); // Ensure probability is never null
    let backgroundColor = '#f8d7da'; // Default red for low probability

    if (probability > 80) {
      backgroundColor = '#d4edda'; // Green for high probability
    } else if (probability >= 40) {
      backgroundColor = '#fff3cd'; // Yellow for medium probability
    }

    return (
      <View
        key={index}
        style={[styles.plantWidget, { backgroundColor }]} // Apply dynamic background color
      >
        <View style={styles.plantWidgetHorizontalLayout}>
          <View style={{ width: '50%' }}>
            <Text style={styles.plantWidgetTitle}>
              {item.plant_name || 'Unknown Plant'}
            </Text>
            <Text style={styles.plantWidgetSubtitle}>
              Common Name: {item.plant_details?.common_names?.[0] || 'Unknown'}
            </Text>
            <Text style={styles.plantWidgetSubtitle}>
              Probability: {probability}%
            </Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.plantWidgetDesc}>
              {item.plant_details?.wiki_description?.value
                ? item.plant_details.wiki_description.value.length > 170
                  ? item.plant_details.wiki_description.value.substring(0, 180) +
                    '... '
                  : item.plant_details.wiki_description.value
                : 'No description available.'}
            </Text>
          </View>
        </View>
        {item.plant_details?.taxonomy && (
          <View style={styles.taxonomyContainer}>
            <Text style={styles.taxonomyTitle}>Taxonomy:</Text>
            <Text style={styles.taxonomyText}>
              Kingdom: {item.plant_details.taxonomy?.kingdom || 'N/A'}
            </Text>
            <Text style={styles.taxonomyText}>
              Phylum: {item.plant_details.taxonomy?.phylum || 'N/A'}
            </Text>
            <Text style={styles.taxonomyText}>
              Class: {item.plant_details.taxonomy?.class || 'N/A'}
            </Text>
            <Text style={styles.taxonomyText}>
              Order: {item.plant_details.taxonomy?.order || 'N/A'}
            </Text>
            <Text style={styles.taxonomyText}>
              Family: {item.plant_details.taxonomy?.family || 'N/A'}
            </Text>
            <Text style={styles.taxonomyText}>
              Genus: {item.plant_details.taxonomy?.genus || 'N/A'}
            </Text>
          </View>
        )}
        {item.plant_details?.wiki_description?.value && (
          <TouchableOpacity
            style={styles.readMoreBtn}
            onPress={() => {
              if (item.plant_details?.url) {
                Linking.openURL(item.plant_details.url);
              }
            }}
          >
            <Text style={styles.readMoreBtnTxt}>Read more</Text>
            <Text style={styles.readMoreBtnArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  })
) : (
  <Text style={styles.loadingText}>📡 Loading plant details...</Text>
)}


      </ScrollView>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView style={styles.camera} ref={ref}>
        <View style={styles.shutterContainer}>
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}>
                <View
                  style={[styles.shutterBtnInner, { backgroundColor: 'white' }]}
                />
              </View>
            )}
          </Pressable>
        </View>
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {uri ? renderPicture() : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  shutterContainer: {
    position: 'absolute',
    bottom: 44,
    left: 130,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: 'transparent',
    borderWidth: 5,
    borderColor: 'white',
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: 300,
    aspectRatio: 1,
    borderRadius: 1000, // Keeps it circular
    marginBottom: 20,
    marginTop: 40,
    backgroundColor: '#fff', // Ensures a clean background
    shadowColor: '#000', // Dark shadow for contrast
    shadowOpacity: 0.9, // Soft shadow for a premium look
    shadowOffset: { width: 0, height: 10 }, // Creates a lifted effect
    shadowRadius: 120, // Smoothens the shadow edges
    elevation: 10, // Android shadow support
  },
  plantWidget: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    width: '100%',
    marginBottom: 20,
  },
  plantWidgetHorizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plantWidgetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  plantWidgetSubtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    marginTop: 10,
  },
  plantWidgetDesc: {
    fontSize: 14,
    color: '#333',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  readMoreBtnTxt: {
    fontSize: 16,
    color: '#1E90FF',
    textDecorationLine: 'underline',
  },
  readMoreBtnArrow: {
    fontSize: 16,
    color: '#1E90FF',
    marginLeft: 5,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },
  taxonomyContainer: {
    backgroundColor: '#FAF9F6',
    padding: 10,
    borderRadius: 8,
    paddingTop: 10,
    marginTop: 10,
    opacity:0.8,
  },
  taxonomyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  taxonomyText: {
    fontSize: 14,
    color: '#555',
  },
  retakeButton: {
    backgroundColor: '#3a3a3a', // Dark gray theme
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30, // Smooth, rounded edges
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', // Deep shadow for depth
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 6, // Android shadow effect
    borderWidth: 2,
    borderColor: '#5a5a5a', // Subtle border for structure,
    marginBottom:10,
  },

  retakeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5f5f5', // Light gray for contrast
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)', // Subtle text shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
