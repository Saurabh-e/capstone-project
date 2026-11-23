import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

// Create Elasticsearch client
export const esClient = new Client({
  node: ELASTICSEARCH_NODE,
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: false,
});

// Index name
export const PRODUCTS_INDEX = 'products';

// Initialize Elasticsearch
export const initElasticsearch = async () => {
  try {
    // Check if connected
    const health = await esClient.cluster.health();
    logger.info(`✅ Elasticsearch connected - Status: ${health.status}`);

    // Check if products index exists
    const indexExists = await esClient.indices.exists({ index: PRODUCTS_INDEX });

    if (!indexExists) {
      // Create products index with mapping
      await esClient.indices.create({
        index: PRODUCTS_INDEX,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              slug: { type: 'keyword' },
              description: { type: 'text', analyzer: 'standard' },
              price: { type: 'float' },
              comparePrice: { type: 'float' },
              rating: { type: 'float' },
              reviewCount: { type: 'integer' },
              inventory: { type: 'integer' },
              status: { type: 'keyword' },
              featured: { type: 'boolean' },
              vendorId: { type: 'keyword' },
              vendorName: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              vendorRating: { type: 'float' },
              categories: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  name: { type: 'keyword' },
                  slug: { type: 'keyword' },
                },
              },
              images: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                autocomplete: {
                  tokenizer: 'autocomplete',
                  filter: ['lowercase'],
                },
              },
              tokenizer: {
                autocomplete: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 10,
                  token_chars: ['letter', 'digit'],
                },
              },
            },
          },
        },
      });

      logger.info(`✅ Created Elasticsearch index: ${PRODUCTS_INDEX}`);
    }
  } catch (error) {
    logger.error('❌ Elasticsearch initialization error:', error);
  }
};

// Product search utilities
export const productSearch = {
  /**
   * Index a product
   */
  async indexProduct(product: any): Promise<void> {
    try {
      await esClient.index({
        index: PRODUCTS_INDEX,
        id: product.id,
        body: product,
        refresh: true,
      });
      logger.debug(`Indexed product: ${product.id}`);
    } catch (error) {
      logger.error('Product indexing error:', error);
    }
  },

  /**
   * Update a product
   */
  async updateProduct(productId: string, updates: any): Promise<void> {
    try {
      await esClient.update({
        index: PRODUCTS_INDEX,
        id: productId,
        body: {
          doc: updates,
        },
        refresh: true,
      });
      logger.debug(`Updated product: ${productId}`);
    } catch (error) {
      logger.error('Product update error:', error);
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      await esClient.delete({
        index: PRODUCTS_INDEX,
        id: productId,
        refresh: true,
      });
      logger.debug(`Deleted product: ${productId}`);
    } catch (error) {
      logger.error('Product deletion error:', error);
    }
  },

  /**
   * Search products
   */
  async searchProducts(params: {
    q?: string;
    category?: string;
    vendor?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<any> {
    const {
      q,
      category,
      vendor,
      minPrice,
      maxPrice,
      rating,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = params;

    // Build query
    const must: any[] = [{ term: { status: 'ACTIVE' } }];
    const filter: any[] = [];

    // Text search
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['name^2', 'description', 'vendorName'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Category filter
    if (category) {
      filter.push({
        nested: {
          path: 'categories',
          query: {
            term: { 'categories.slug': category },
          },
        },
      });
    }

    // Vendor filter
    if (vendor) {
      filter.push({ term: { vendorId: vendor } });
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange: any = {};
      if (minPrice !== undefined) priceRange.gte = minPrice;
      if (maxPrice !== undefined) priceRange.lte = maxPrice;
      filter.push({ range: { price: priceRange } });
    }

    // Rating filter
    if (rating !== undefined) {
      filter.push({ range: { rating: { gte: rating } } });
    }

    // Build sort
    const sortField: any = {};
    sortField[sort] = { order };

    try {
      const result = await esClient.search({
        index: PRODUCTS_INDEX,
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort: [sortField],
          from: (page - 1) * limit,
          size: limit,
        },
      });

      return {
        products: result.hits.hits.map((hit: any) => hit._source),
        total: result.hits.total.value,
        page,
        limit,
        pages: Math.ceil(result.hits.total.value / limit),
      };
    } catch (error) {
      logger.error('Product search error:', error);
      return {
        products: [],
        total: 0,
        page,
        limit,
        pages: 0,
      };
    }
  },

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: string, limit: number = 10): Promise<string[]> {
    try {
      const result = await esClient.search({
        index: PRODUCTS_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['name'],
                    type: 'phrase_prefix',
                  },
                },
                { term: { status: 'ACTIVE' } },
              ],
            },
          },
          _source: ['name'],
          size: limit,
        },
      });

      return result.hits.hits.map((hit: any) => hit._source.name);
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  },
};

export default esClient;
