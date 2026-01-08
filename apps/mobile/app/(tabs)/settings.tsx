import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Linking } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  colors: typeof Colors.light;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement, colors }: SettingsItemProps) {
  return (
    <Pressable
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingsIconContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ?? (
        onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* App section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APLICACIÓN</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsItem
            icon="notifications-outline"
            title="Notificaciones"
            subtitle="Alertas de buen tiempo"
            colors={colors}
            rightElement={
              <Switch
                value={false}
                trackColor={{ false: colors.muted, true: colors.primary }}
              />
            }
          />
          <SettingsItem
            icon="location-outline"
            title="Ubicación"
            subtitle="Mostrar zonas cercanas"
            colors={colors}
            rightElement={
              <Switch
                value={true}
                trackColor={{ false: colors.muted, true: colors.primary }}
              />
            }
          />
          <SettingsItem
            icon="download-outline"
            title="Datos offline"
            subtitle="Guardar zonas para uso sin conexión"
            onPress={() => {}}
            colors={colors}
          />
        </View>
      </View>

      {/* Data sources */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FUENTES DE DATOS</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsItem
            icon="globe-outline"
            title="theCrag"
            subtitle="Zonas de escalada"
            onPress={() => openLink('https://www.thecrag.com')}
            colors={colors}
          />
          <SettingsItem
            icon="partly-sunny-outline"
            title="Meteoblue"
            subtitle="Datos meteorológicos"
            onPress={() => openLink('https://www.meteoblue.com')}
            colors={colors}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACERCA DE</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsItem
            icon="information-circle-outline"
            title="Versión"
            subtitle="1.0.0"
            colors={colors}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Términos de uso"
            onPress={() => {}}
            colors={colors}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            title="Política de privacidad"
            onPress={() => {}}
            colors={colors}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ClimbZone © {new Date().getFullYear()}
        </Text>
        <Text style={[styles.footerSubtext, { color: colors.mutedForeground }]}>
          Hecho con ❤️ para escaladores
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
});




