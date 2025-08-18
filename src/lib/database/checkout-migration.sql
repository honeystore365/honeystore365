-- Migration pour supporter le nouveau système de checkout

-- Ajouter la colonne notes à la table orders si elle n'existe pas
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ajouter la colonne delivery_fee à la table orders si elle n'existe pas
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- Ajouter la colonne shipping_address_id à la table orders si elle n'existe pas
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES addresses(id);

-- Créer la table payments si elle n'existe pas
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur order_id pour les performances
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Créer un index sur status pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Ajouter des contraintes pour les méthodes de paiement valides
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS check_payment_method 
CHECK (payment_method IN ('cash_on_delivery', 'bank_transfer', 'paypal'));

-- Ajouter des contraintes pour les statuts de paiement valides
ALTER TABLE payments 
ADD CONSTRAINT IF NOT EXISTS check_payment_status 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Mettre à jour la colonne updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour la table payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();