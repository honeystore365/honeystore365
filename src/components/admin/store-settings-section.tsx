'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase';
import { Edit2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface StoreSettings {
  id: string;
  store_name: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_rate?: number;
  currency: string;
  updated_at: string;
}

export default function StoreSettingsSection() {
  const supabase = createClient();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    store_description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    tax_rate: 0,
    currency: 'TND',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('store_settings').select('*').single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setFormData({
          store_name: data.store_name || '',
          store_description: data.store_description || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          tax_rate: data.tax_rate || 0,
          currency: data.currency || 'TND',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (settings) {
        // Mise à jour
        const { error } = await supabase.from('store_settings').update(formData).eq('id', settings.id);

        if (error) throw error;

        setSettings({ ...settings, ...formData });
      } else {
        // Création
        const { data, error } = await supabase.from('store_settings').insert([formData]).select().single();

        if (error) throw error;
        setSettings(data);
      }

      setEditing(false);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        store_description: settings.store_description || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        address: settings.address || '',
        tax_rate: settings.tax_rate || 0,
        currency: settings.currency || 'TND',
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du magasin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Paramètres du magasin</CardTitle>
          <CardDescription>Configurez les informations de base de votre magasin</CardDescription>
        </div>
        <Button variant={editing ? 'outline' : 'default'} onClick={() => (editing ? handleCancel() : setEditing(true))}>
          {editing ? <X className='h-4 w-4' /> : <Edit2 className='h-4 w-4' />}
          {editing ? 'Annuler' : 'Modifier'}
        </Button>
      </CardHeader>
      <CardContent>
        {editing ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
            className='space-y-4'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='store_name'>Nom du magasin *</Label>
                <Input
                  id='store_name'
                  value={formData.store_name}
                  onChange={e => setFormData({ ...formData, store_name: e.target.value })}
                  required
                  placeholder='Nom de votre magasin'
                />
              </div>
              <div>
                <Label htmlFor='contact_email'>Email de contact</Label>
                <Input
                  id='contact_email'
                  type='email'
                  value={formData.contact_email}
                  onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder='contact@monmagasin.com'
                />
              </div>
              <div>
                <Label htmlFor='contact_phone'>Téléphone</Label>
                <Input
                  id='contact_phone'
                  value={formData.contact_phone}
                  onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder='+216 XX XXX XXX'
                />
              </div>
              <div>
                <Label htmlFor='currency'>Devise</Label>
                <Input
                  id='currency'
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  placeholder='TND'
                />
              </div>
              <div>
                <Label htmlFor='tax_rate'>Taux de TVA (%)</Label>
                <Input
                  id='tax_rate'
                  type='number'
                  step='0.01'
                  min='0'
                  max='100'
                  value={formData.tax_rate}
                  onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  placeholder='19'
                />
              </div>
            </div>

            <div>
              <Label htmlFor='store_description'>Description du magasin</Label>
              <Textarea
                id='store_description'
                value={formData.store_description}
                onChange={e => setFormData({ ...formData, store_description: e.target.value })}
                rows={3}
                placeholder='Description de votre magasin...'
              />
            </div>

            <div>
              <Label htmlFor='address'>Adresse</Label>
              <Textarea
                id='address'
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder='Adresse complète de votre magasin...'
              />
            </div>

            <div className='flex gap-2'>
              <Button type='submit'>
                <Save className='h-4 w-4 mr-2' />
                Enregistrer
              </Button>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <div className='space-y-4'>
            {!settings ? (
              <div className='text-center py-8 text-muted-foreground'>
                <p>Aucun paramètre configuré</p>
                <p className='text-sm'>Cliquez sur "Modifier" pour configurer votre magasin</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Nom du magasin</Label>
                  <p className='mt-1 font-medium'>{settings.store_name || 'Non défini'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Email de contact</Label>
                  <p className='mt-1'>{settings.contact_email || 'Non défini'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Téléphone</Label>
                  <p className='mt-1'>{settings.contact_phone || 'Non défini'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Devise</Label>
                  <p className='mt-1'>{settings.currency || 'TND'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Taux de TVA</Label>
                  <p className='mt-1'>{settings.tax_rate || 0}%</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-muted-foreground'>Dernière mise à jour</Label>
                  <p className='mt-1 text-sm'>
                    {settings.updated_at ? new Date(settings.updated_at).toLocaleDateString('fr-FR') : 'Jamais'}
                  </p>
                </div>
                {settings.store_description && (
                  <div className='md:col-span-2'>
                    <Label className='text-sm font-medium text-muted-foreground'>Description</Label>
                    <p className='mt-1'>{settings.store_description}</p>
                  </div>
                )}
                {settings.address && (
                  <div className='md:col-span-2'>
                    <Label className='text-sm font-medium text-muted-foreground'>Adresse</Label>
                    <p className='mt-1'>{settings.address}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
