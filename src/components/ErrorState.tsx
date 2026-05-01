import { Pressable, StyleSheet, Text, View } from 'react-native';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Cek koneksi internet</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Coba Lagi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE4E2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDA29B',
    padding: 14,
    marginVertical: 10,
  },
  message: {
    color: '#B42318',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  hint: {
    color: '#7A271A',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#B42318',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
