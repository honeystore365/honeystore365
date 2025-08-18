-- Migration pour la table store_settings
-- Création de la table des paramètres du magasin

-- Supprimer la table si elle existe déjà (pour les tests)
DROP TABLE IF EXISTS store_settings;

-- Créer la table store_settings
CREATE TABLE store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    store_description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'TND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_settings_updated_at 
    BEFORE UPDATE ON store_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politique de sécurité RLS (Row Level Security)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read access to store_settings" ON store_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion/mise à jour aux admins seulement
CREATE POLICY "Allow admin full access to store_settings" ON store_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'user_role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insérer des paramètres par défaut (optionnel)
INSERT INTO store_settings (
    store_name,
    store_description,
    contact_email,
    currency,
    tax_rate
) VALUES (
    'Mon Magasin',
    'Description de mon magasin en ligne',
    'contact@monmagasin.com',
    'TND',
    19.00
) ON CONFLICT DO NOTHING;

-- Commentaires pour la documentation
COMMENT ON TABLE store_settings IS 'Paramètres généraux du magasin';
COMMENT ON COLUMN store_settings.store_name IS 'Nom du magasin';
COMMENT ON COLUMN store_settings.store_description IS 'Description du magasin';
COMMENT ON COLUMN store_settings.contact_email IS 'Email de contact du magasin';
COMMENT ON COLUMN store_settings.contact_phone IS 'Téléphone de contact du magasin';
COMMENT ON COLUMN store_settings.address IS 'Adresse physique du magasin';
COMMENT ON COLUMN store_settings.tax_rate IS 'Taux de TVA par défaut en pourcentage';
COMMENT ON COLUMN store_settings.currency IS 'Devise utilisée par le magasin';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_store_settings_updated_at ON store_settings(updated_at);

-- Vérification que la table a été créée correctement
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_settings' 
ORDER BY ordinal_position;