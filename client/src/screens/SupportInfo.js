/**
 * Support & Info Screen
 * Help, Contact, and Privacy - Tabbed View
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const SupportInfoScreen = ({ route, navigation }) => {
  const { initialTab } = route.params || {};
  const [activeTab, setActiveTab] = useState(initialTab || 'help');

  const handleEmail = () => {
    Linking.openURL('mailto:support@eain.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+923001234567');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/923001234567');
  };

  // Help & Support Tab Content
  const HelpContent = () => (
    <View>
      <Text style={styles.sectionDesc}>
        Need assistance? We're here to help you 24/7
      </Text>

      <TouchableOpacity style={styles.actionCard} onPress={handleEmail}>
        <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
          <Ionicons name="mail-outline" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Email Support</Text>
          <Text style={styles.actionSubtitle}>support@eain.com</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={handlePhone}>
        <View style={[styles.actionIcon, { backgroundColor: '#10b98120' }]}>
          <Ionicons name="call-outline" size={28} color="#10b981" />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Call Us</Text>
          <Text style={styles.actionSubtitle}>+92 300 1234567</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={handleWhatsApp}>
        <View style={[styles.actionIcon, { backgroundColor: '#25D36620' }]}>
          <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>WhatsApp</Text>
          <Text style={styles.actionSubtitle}>Chat with us instantly</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I add a product?</Text>
        <Text style={styles.faqAnswer}>
          Go to your dashboard and click "Add Product" button. Fill in the product details and submit.
        </Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I edit my business info?</Text>
        <Text style={styles.faqAnswer}>
          Navigate to Business Information from your dashboard and click the edit icon.
        </Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do payments work?</Text>
        <Text style={styles.faqAnswer}>
          Payments are processed securely. You'll receive funds directly to your registered bank account.
        </Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I manage orders?</Text>
        <Text style={styles.faqAnswer}>
          Navigate to Orders from your dashboard. You can view pending, delivered, and all orders from there.
        </Text>
      </View>
    </View>
  );

  // Contact Us Tab Content
  const ContactContent = () => (
    <View>
      <Text style={styles.sectionDesc}>
        Get in touch with us. We'd love to hear from you!
      </Text>

      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="location-outline" size={24} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Our Office</Text>
        </View>
        <Text style={styles.contactText}>
          123 Business Street{'\n'}
          Karachi, Pakistan{'\n'}
          75500
        </Text>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="time-outline" size={24} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Business Hours</Text>
        </View>
        <Text style={styles.contactText}>
          Monday - Friday: 9:00 AM - 6:00 PM{'\n'}
          Saturday: 10:00 AM - 4:00 PM{'\n'}
          Sunday: Closed
        </Text>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Email Addresses</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@eain.com')}>
          <Text style={styles.contactLink}>support@eain.com</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:vendor@eain.com')}>
          <Text style={styles.contactLink}>vendor@eain.com</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:info@eain.com')}>
          <Text style={styles.contactLink}>info@eain.com</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="call-outline" size={24} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Phone Numbers</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+923001234567')}>
          <Text style={styles.contactLink}>+92 300 1234567 (Support)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('tel:+923009876543')}>
          <Text style={styles.contactLink}>+92 300 9876543 (Sales)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Ionicons name="planet-outline" size={24} color={COLORS.primary} />
          <Text style={styles.contactTitle}>Social Media</Text>
        </View>
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          <Text style={styles.socialText}>Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-instagram" size={20} color="#E4405F" />
          <Text style={styles.socialText}>Instagram</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
          <Text style={styles.socialText}>Twitter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Privacy Policy Tab Content
  const PrivacyContent = () => (
    <View>
      <Text style={styles.sectionDesc}>
        Your privacy is important to us. Read how we handle your data.
      </Text>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>📋 Data Collection</Text>
        <Text style={styles.policyText}>
          We collect information you provide directly to us, such as when you create an account, list products, or contact us for support. This includes your name, email, phone number, business details, and product information.
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>🔍 How We Use Your Data</Text>
        <Text style={styles.policyText}>
          • To provide and maintain our services{'\n'}
          • To process your transactions and orders{'\n'}
          • To send you updates and notifications{'\n'}
          • To improve our platform and user experience{'\n'}
          • To prevent fraud and ensure security{'\n'}
          • To comply with legal obligations
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>🔒 Data Security</Text>
        <Text style={styles.policyText}>
          We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>🤝 Data Sharing</Text>
        <Text style={styles.policyText}>
          We do not sell your personal information. We may share your data with:{'\n'}
          • Service providers who help us operate our platform{'\n'}
          • Payment processors for transactions{'\n'}
          • Law enforcement when legally required{'\n'}
          • Business partners with your consent
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>✅ Your Rights</Text>
        <Text style={styles.policyText}>
          You have the right to:{'\n'}
          • Access your personal information{'\n'}
          • Update or correct your data{'\n'}
          • Delete your account and data{'\n'}
          • Opt-out of marketing communications{'\n'}
          • Request a copy of your data{'\n'}
          • Withdraw consent at any time
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>🍪 Cookies & Tracking</Text>
        <Text style={styles.policyText}>
          We use cookies and similar tracking technologies to improve your experience, analyze usage, and deliver personalized content. You can control cookie preferences in your device settings.
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>👶 Children's Privacy</Text>
        <Text style={styles.policyText}>
          Our services are not intended for users under 18 years of age. We do not knowingly collect personal information from children.
        </Text>
      </View>

      <View style={styles.policyCard}>
        <Text style={styles.policyHeading}>📝 Changes to Policy</Text>
        <Text style={styles.policyText}>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
        </Text>
      </View>

      <Text style={styles.policyFooter}>
        Last updated: November 29, 2025
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Info</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'help' && styles.tabActive]}
          onPress={() => setActiveTab('help')}
        >
          <Ionicons 
            name="help-circle-outline" 
            size={20} 
            color={activeTab === 'help' ? COLORS.primary : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'help' && styles.tabTextActive]}>
            Help & Support
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.tabActive]}
          onPress={() => setActiveTab('contact')}
        >
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={activeTab === 'contact' ? COLORS.primary : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>
            Contact Us
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Ionicons 
            name="shield-checkmark-outline" 
            size={20} 
            color={activeTab === 'privacy' ? COLORS.primary : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'help' && <HelpContent />}
        {activeTab === 'contact' && <ContactContent />}
        {activeTab === 'privacy' && <PrivacyContent />}
      </ScrollView>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 24,
  },
  faqCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  contactLink: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    color: '#666',
  },
  policyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  policyHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  policyFooter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default SupportInfoScreen;
