import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportData, importData, initDatabase } from '../database';
import { colors } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import CustomDialog from '../components/CustomDialog';
import Toast from '../components/Toast';

export default function BackupScreen() {
  const navigation = useNavigation();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'default' as 'default' | 'danger',
    onConfirm: () => {},
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const showDialog = (title: string, message: string, onConfirm: () => void, type: 'default' | 'danger' = 'default') => {
    setDialogConfig({
      title,
      message,
      type,
      onConfirm,
    });
    setDialogVisible(true);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleExport = async () => {
    try {
      const data = exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, jsonString);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: '保存备份文件',
        });
        showToast('备份文件已生成', 'success');
      } else {
        showToast('分享功能不可用', 'error');
      }
    } catch (error) {
      showToast('导出失败，请重试', 'error');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const data = JSON.parse(content);

      // Validate data structure
      if (!data.habits || !data.checkins || !Array.isArray(data.habits)) {
        showToast('无效的备份文件', 'error');
        return;
      }

      showDialog(
        '确认恢复',
        `这将覆盖当前所有数据，恢复 ${data.habits.length} 个习惯、${data.checkins.length} 条记录。确定吗？`,
        async () => {
          try {
            importData(data);
            setDialogVisible(false);
            showToast('数据恢复成功！', 'success');
            // 重新初始化数据库连接
            initDatabase();
          } catch (error) {
            showToast('恢复失败', 'error');
          }
        },
        'danger'
      );
    } catch (error) {
      showToast('导入失败，请检查文件', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomDialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogVisible(false)}
        type={dialogConfig.type}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>数据备份</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>重要提示</Text>
          <Text style={styles.warningText}>
            定期备份可以保护您的数据安全。建议在以下情况备份：{'\n'}
            • 更换手机前{'\n'}
            • 每周定期备份{'\n'}
            • 重要数据更新后
          </Text>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📤 导出数据</Text>
          <Text style={styles.sectionDesc}>
            将所有习惯、打卡记录、挑战数据导出为 JSON 文件，可以保存到文件管理器、iCloud 或发送到微信/邮箱。
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.actionButtonText}>立即备份</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📥 恢复数据</Text>
          <Text style={styles.sectionDesc}>
            从之前导出的备份文件中恢复数据。这将覆盖当前所有数据，请谨慎操作。
          </Text>
          <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={handleImport}>
            <Text style={styles.importButtonText}>选择备份文件</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsEmoji}>💡</Text>
          <Text style={styles.tipsTitle}>备份小贴士</Text>
          <Text style={styles.tipsText}>
            • 备份文件包含所有数据，请妥善保管{'\n'}
            • 可以将备份文件发送到微信"文件传输助手"保存{'\n'}
            • 恢复数据后请检查数据是否完整{'\n'}
            • 支持跨平台恢复（iOS ↔ Android）
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  warningCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  importButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  tipsCard: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  tipsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  spacer: {
    height: 32,
  },
});
