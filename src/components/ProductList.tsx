'use client';

import { memo, useMemo } from 'react';
import { VirtualGrid } from './ui/virtual-grid';
import ProductCardClient from './ProductCardClient';

interface Product {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

interface ProductListProps {
  products: Product[];
  useVirtualization?: boolean;
  className?: string;
}

const ProductList = memo<ProductListProps>(
  ({ products, useVirtualization = false, className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' }) => {
    const memoizedProducts = useMemo(() => products, [products]);

    const renderProduct = useMemo(
      () => (product: Product, index: number) => <ProductCardClient key={product.id} product={product} />,
      []
    );

    if (useVirtualization && products.length > 20) {
      return (
        <VirtualGrid
          items={memoizedProducts}
          renderItem={renderProduct}
          itemHeight={400}
          containerHeight={800}
          itemsPerRow={3}
          gap={32}
          className='w-full'
        />
      );
    }

    return (
      <div className={className}>
        {memoizedProducts.map(product => (
          <ProductCardClient key={product.id} product={product} />
        ))}
      </div>
    );
  }
);

ProductList.displayName = 'ProductList';

export default ProductList;
