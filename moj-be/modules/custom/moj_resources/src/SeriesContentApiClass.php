<?php

namespace Drupal\moj_resources;

use Drupal\node\NodeInterface;
use Drupal\Core\Entity\Query\QueryFactory;
use Drupal\Core\Entity\EntityTypeManagerInterface;
/**
 * PromotedContentApiClass
 */

class SeriesContentApiClass
{
    /**
     * Node IDs
     *
     * @var array
     */
    protected $nids = array();
    /**
     * Nodes
     *
     * @var array
     */
    protected $nodes = array();
    /**
     * Language Tag
     *
     * @var string
     */
    protected $lang;
    /**
     * Node_storage object
     *
     * @var Drupal\Core\Entity\EntityManagerInterface
     */
    protected $node_storage;
    /**
     * Entitity Query object
     *
     * @var Drupal\Core\Entity\Query\QueryFactory
     * 
     * Instance of querfactory 
     */
    protected $entity_query;
    /**
     * Class Constructor 
     *
     * @param EntityTypeManagerInterface $entityTypeManager
     * @param QueryFactory $entityQuery
     */
    public function __construct(
        EntityTypeManagerInterface $entityTypeManager, 
        QueryFactory $entityQuery
    ) {
        $this->node_storage = $entityTypeManager->getStorage('node');
        $this->entity_query = $entityQuery;
    }
    /**
     * API resource function
     *
     * @param [string] $lang
     * @return array
     */
    public function SeriesContentApiEndpoint($lang, $category, $number)
    {
        $this->lang = $lang;
        $this->nids = self::getSeriesContentNodeIds($category, $number);
        $this->nodes = self::loadNodesDetails($this->nids);
        usort($this->nodes, 'self::sortEpisodes');
        usort($this->nodes, 'self::groupSeasons');
        return array_map('self::translateNode', $this->nodes);
    }
    /**
     * sortEpisodes
     *
     */
    protected function sortEpisodes($a, $b)
    {
        return (int)$a->field_moj_episode->value < (int)$b->field_moj_episode->value;
    }
    /**
     * groupSeasons
     *
     */
    protected function groupSeasons($a, $b)
    {
        return (int)$a->field_moj_season->value < (int)$b->field_moj_season->value;
    }
    /**
     * TranslateNode function
     *
     * @param NodeInterface $node
     * 
     * @return $node
     */
    protected function translateNode(NodeInterface $node) 
    {
        return $node->hasTranslation($this->lang) ? $node->getTranslation($this->lang) : $node;
    }
    
    /**
     * Get nids
     *
     * @return void
     */
    protected function getSeriesContentNodeIds($category, $number)
    {
        $results = $this->entity_query->get('node')
            ->condition('status', 1);
        if ($category !== 0) {
            $results->condition('field_moj_series', $category);
        };
        if ($number !== 0) {
            $results->range(0, $number);
        };
        $results->accessCheck(false);        
        return $results->execute();
    }
    /**
     * Load full node details
     *
     * @param array $nids
     * @return array 
     */
    protected function loadNodesDetails(array $nids)
    {
        return array_filter(
            $this->node_storage->loadMultiple($nids), function ($item) 
            {
                return $item->access();
            }
        );
    }
    /**
     * Sanitise node
     *
     * @param [type] $item
     * @return void
     */
    protected function serialize($item) 
    {
        $serializer = \Drupal::service($item->getType().'.serializer.default'); // TODO: Inject dependency
        return $serializer->serialize($item, 'json', ['plugin_id' => 'entity']);
    }
}